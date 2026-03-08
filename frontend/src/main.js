import { Encrypt, Decrypt, ReadKeyAndTextFromFile, SaveKeyAndResultToFile } from '../wailsjs/go/main/App';

// Функция инициализации
function initializeApp() {
    // Получаем элементы
    const railFenceRadio = document.querySelector('input[value="railfence"]');
    const vigenereRadio = document.querySelector('input[value="vigenere"]');
    const keyInput = document.getElementById('keyInput');
    const keyError = document.getElementById('keyError');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Элементы для файлов
    const readFileInput = document.getElementById('readFileInput');
    const readFileBtn = document.getElementById('readFileBtn');
    const readFileInfo = document.getElementById('readFileInfo');
    const saveFileBtn = document.getElementById('saveFileBtn');
    const saveFileInfo = document.getElementById('saveFileInfo');

    // Функция валидации
    function validateKey() {
        const method = document.querySelector('input[name="cipherMethod"]:checked').value;
        const key = keyInput.value.trim();

        keyInput.classList.remove('input-error');
        keyError.textContent = '';

        if (!key) {
            keyInput.classList.add('input-error');
            keyError.textContent = 'Ключ не может быть пустым';
            return false;
        }

        return true;
    }

    // Функция обновления состояния кнопки сохранения
    function updateSaveButtonState() {
        const hasResult = outputText.value.trim() &&
            outputText.value !== '⏳ Шифрование...' &&
            outputText.value !== '⏳ Дешифрование...' &&
            !outputText.value.startsWith('❌') &&
            !outputText.value.startsWith('Ошибка');

        saveFileBtn.disabled = !hasResult;

        if (hasResult) {
            saveFileBtn.style.opacity = '1';
            saveFileBtn.style.cursor = 'pointer';
            saveFileBtn.title = 'Сохранить ключ и результат в файл';
        } else {
            saveFileBtn.style.opacity = '0.5';
            saveFileBtn.style.cursor = 'not-allowed';
            saveFileBtn.title = 'Дождитесь получения результата';
        }
    }

    // Функция шифрования
    async function encrypt() {
        if (!validateKey()) return;
        if (!inputText.value.trim()) {
            alert('Введите текст');
            return;
        }

        const method = document.querySelector('input[name="cipherMethod"]:checked').value;
        const key = keyInput.value.trim();
        const text = inputText.value.trim();

        try {
            outputText.value = '⏳ Шифрование...';
            console.log('Вызов Encrypt с:', { method, key, text });

            const result = await Encrypt(method, key, text);

            console.log('Результат:', result);
            outputText.value = result;

            // Обновляем состояние кнопки сохранения
            updateSaveButtonState();
        } catch (error) {
            console.error('Ошибка шифрования:', error);
            outputText.value = '❌ Ошибка при шифровании: ' + error.message;
            updateSaveButtonState();
        }
    }

    // Функция дешифрования
    async function decrypt() {
        if (!validateKey()) return;
        if (!inputText.value.trim()) {
            alert('Введите текст');
            return;
        }

        const method = document.querySelector('input[name="cipherMethod"]:checked').value;
        const key = keyInput.value.trim();
        const text = inputText.value.trim();

        try {
            outputText.value = '⏳ Дешифрование...';
            console.log('Вызов Decrypt с:', { method, key, text });

            const result = await Decrypt(method, key, text);

            console.log('Результат:', result);
            outputText.value = result;

            // Обновляем состояние кнопки сохранения
            updateSaveButtonState();
        } catch (error) {
            console.error('Ошибка дешифрования:', error);
            outputText.value = '❌ Ошибка при дешифровании: ' + error.message;
            updateSaveButtonState();
        }
    }

    // Функция чтения ключа и текста из файла
    // Функция чтения ключа и текста из файла
    async function readKeyAndTextFromFile() {
        if (!readFileInput.files || readFileInput.files.length === 0) {
            alert('Выберите файл для чтения');
            return;
        }

        const file = readFileInput.files[0];

        // Проверка размера файла
        if (file.size > 5 * 1024 * 1024) {
            if (!confirm('Файл большой (>5MB). Чтение может занять время. Продолжить?')) {
                return;
            }
        }

        readFileInfo.textContent = `⏳ Чтение файла: ${file.name}...`;
        readFileInfo.className = 'file-info';

        try {
            console.log('Путь к файлу:', file.path);

            // В Wails в режиме разработки file.path может быть undefined
            // Используем file.name если file.path недоступен
            const filePath = file.path || file.name;

            // Читаем ключ и текст из файла
            const result = await ReadKeyAndTextFromFile(filePath);

            // Проверяем, что результат не пустой
            if (!result) {
                throw new Error('Не удалось прочитать файл');
            }

            // Заполняем поля
            if (result.Key) {
                keyInput.value = result.Key;
            }
            if (result.Text) {
                inputText.value = result.Text;
            }

            // Очищаем результат
            outputText.value = '';

            // Обновляем состояние кнопки сохранения
            updateSaveButtonState();

            readFileInfo.textContent = `✅ Файл "${file.name}" загружен (ключ и текст)`;
            readFileInfo.className = 'file-info success';

            console.log('Файл прочитан успешно:', result);
        } catch (error) {
            console.error('Ошибка чтения файла:', error);

            // Более подробное сообщение об ошибке
            let errorMessage = error.message;
            if (error.message.includes('no such file')) {
                errorMessage = 'Файл не найден. Убедитесь, что файл существует и доступен для чтения.';
            } else if (error.message.includes('permission denied')) {
                errorMessage = 'Нет прав доступа к файлу.';
            }

            readFileInfo.textContent = `❌ Ошибка: ${errorMessage}`;
            readFileInfo.className = 'file-info error';
            alert('Не удалось прочитать файл: ' + errorMessage);
        }
    }

    // Функция сохранения ключа и результата в файл
    async function saveKeyAndResultToFile() {
        const key = keyInput.value.trim();
        const result = outputText.value.trim();

        if (!key) {
            alert('Введите ключ');
            return;
        }

        if (!result) {
            alert('Нет результата для сохранения');
            return;
        }

        // Создаем диалог сохранения файла
        const fileName = prompt('Введите имя файла для сохранения (например, encrypted.txt):', 'encrypted.txt');
        if (!fileName) return;

        try {
            saveFileInfo.textContent = '⏳ Сохранение...';
            saveFileInfo.className = 'file-info';

            // Сохраняем ключ и результат
            await SaveKeyAndResultToFile(fileName, key, result);

            saveFileInfo.textContent = `✅ Ключ и результат сохранены в файл "${fileName}"`;
            saveFileInfo.className = 'file-info success';
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            saveFileInfo.textContent = `❌ Ошибка: ${error.message}`;
            saveFileInfo.className = 'file-info error';
            alert('Не удалось сохранить файл: ' + error.message);
        }
    }

    // Вспомогательная функция для форматирования размера файла
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Байт';
        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Функция очистки
    function clearAll() {
        keyInput.value = '';
        inputText.value = '';
        outputText.value = '';
        keyInput.classList.remove('input-error');
        keyError.textContent = '';
        if (railFenceRadio) railFenceRadio.checked = true;

        // Сброс файловых элементов
        readFileInput.value = '';
        readFileInfo.textContent = '';
        readFileInfo.className = 'file-info';
        saveFileInfo.textContent = '';
        saveFileInfo.className = 'file-info';

        // Обновляем состояние кнопки сохранения
        updateSaveButtonState();
    }

    // Добавляем обработчики
    encryptBtn.addEventListener('click', encrypt);
    decryptBtn.addEventListener('click', decrypt);
    clearBtn.addEventListener('click', clearAll);
    readFileBtn.addEventListener('click', readKeyAndTextFromFile);
    saveFileBtn.addEventListener('click', saveKeyAndResultToFile);

    keyInput.addEventListener('input', () => {
        keyInput.classList.remove('input-error');
        keyError.textContent = '';
    });

    // Меняем подсказку при смене метода
    if (railFenceRadio) {
        railFenceRadio.addEventListener('change', () => {
            keyInput.placeholder = 'Введите число';
            keyInput.value = '';
            keyError.textContent = '';
            keyInput.classList.remove('input-error');
            updateSaveButtonState();
        });
    }

    if (vigenereRadio) {
        vigenereRadio.addEventListener('change', () => {
            keyInput.placeholder = 'Введите русское слово';
            keyInput.value = '';
            keyError.textContent = '';
            keyInput.classList.remove('input-error');
            updateSaveButtonState();
        });
    }

    // Показываем имя выбранного файла
    readFileInput.addEventListener('change', () => {
        if (readFileInput.files && readFileInput.files.length > 0) {
            const file = readFileInput.files[0];
            readFileInfo.textContent = `📄 Выбран: ${file.name} (${formatFileSize(file.size)})`;
            readFileInfo.className = 'file-info';
        } else {
            readFileInfo.textContent = '';
        }
    });

    // Следим за изменением результата
    const observer = new MutationObserver(() => {
        updateSaveButtonState();
    });

    observer.observe(outputText, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
    });

    // Инициализация состояния кнопки сохранения
    updateSaveButtonState();
}

// Запускаем приложение после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}