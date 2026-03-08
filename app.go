package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ExtractNumberFromKey извлекает все цифры из строки и формирует число
func ExtractNumberFromKey(key string) (int, error) {
	var digits strings.Builder

	// Проходим по каждому символу строки
	for _, ch := range key {
		if unicode.IsDigit(ch) {
			digits.WriteRune(ch)
		}
	}

	// Если цифр нет, возвращаем ошибку
	if digits.Len() == 0 {
		return 0, fmt.Errorf("в ключе не найдено цифр")
	}

	// Преобразуем полученную строку цифр в число
	number, err := strconv.Atoi(digits.String())
	if err != nil {
		return 0, fmt.Errorf("ошибка преобразования в число: %v", err)
	}

	return number, nil
}

func cleanRussian(text string) string {
	var result []rune
	for _, c := range text {
		upper := unicode.ToUpper(c)
		// Проверка на русские буквы
		if (upper >= 'А' && upper <= 'Я') || upper == 'Ё' {
			result = append(result, upper)
		}
	}
	return string(result)
}

func cleanEnglish(text string) string {
	var result []rune
	for _, c := range text {
		upper := unicode.ToUpper(c)
		if upper >= 'A' && upper <= 'Z' {
			result = append(result, upper)
		}
	}
	return string(result)
}

// Правильная реализация шифра "Железнодорожная изгородь"
func EncryptRailFence(rails int, text string) string {
	if rails <= 1 {
		return cleanEnglish(text) // Если ключ 1 или меньше, шифрование не имеет смысла
	}

	cleanText := cleanEnglish(text)
	if cleanText == "" {
		return ""
	}

	// Создаем слайс для каждого рельса
	fence := make([][]rune, rails)
	for i := range fence {
		fence[i] = make([]rune, 0)
	}

	// Индекс текущего рельса и направление
	rail := 0
	direction := 1 // 1 - вниз, -1 - вверх

	// Распределяем символы по рельсам зигзагом
	for _, ch := range cleanText {
		fence[rail] = append(fence[rail], ch)

		rail += direction

		// Меняем направление на границах
		if rail == 0 || rail == rails-1 {
			direction = -direction
		}
	}

	// Объединяем все рельсы
	var result strings.Builder
	for i := 0; i < rails; i++ {
		result.WriteString(string(fence[i]))
	}

	return result.String()
}

var russianAlphabet = []rune("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")

func englishCharToInt(c rune) int {
	c = unicode.ToUpper(c)
	return int(c - 'A')
}

func intToEnglishChar(n int) rune {
	return rune(n + 'A')
}

func russianCharToInt(c rune) int {
	for i, ch := range russianAlphabet {
		if ch == c {
			return i
		}
	}
	return 0
}

func intToRussianChar(n int) rune {
	if n >= 0 && n < len(russianAlphabet) {
		return russianAlphabet[n]
	}
	return russianAlphabet[0]
}

func extendKey(key string, targetLength int, isRussian bool) string {
	var cleanKey string
	if isRussian {
		cleanKey = cleanRussian(key)
	} else {
		cleanKey = cleanEnglish(key)
	}

	if len(cleanKey) == 0 {
		return ""
	}

	keyRunes := []rune(cleanKey)
	keyLen := utf8.RuneCountInString(cleanKey)
	result := make([]rune, targetLength)

	for i := 0; i < targetLength; i++ {
		result[i] = keyRunes[i%keyLen]
	}

	return string(result)
}

// Константа для русского алфавита (как слайс рун)

func EncryptVigenere(key, text string) string {
	cleanText := cleanRussian(text)
	cleanKey := cleanRussian(key)

	if cleanText == "" || cleanKey == "" {
		return ""
	}

	// Преобразуем в руны для правильной индексации
	textRunes := []rune(cleanText)

	extendedKey := extendKey(cleanKey, len(textRunes), true)
	extendedKeyRunes := []rune(extendedKey)

	var result strings.Builder
	result.Grow(len(textRunes))

	for i := 0; i < len(textRunes); i++ {
		textChar := russianCharToInt(textRunes[i])
		keyChar := russianCharToInt(extendedKeyRunes[i])
		encryptedChar := (textChar + keyChar) % 33
		result.WriteRune(intToRussianChar(encryptedChar))
	}

	return result.String()
}

func DecryptVigenere(key, cipherText string) string {
	cleanCipher := cleanRussian(cipherText)
	cleanKey := cleanRussian(key)

	if cleanCipher == "" || cleanKey == "" {
		return ""
	}

	cipherRunes := []rune(cleanCipher)

	extendedKey := extendKey(cleanKey, len(cipherRunes), true)
	extendedKeyRunes := []rune(extendedKey)

	var result strings.Builder
	result.Grow(len(cipherRunes))

	for i := 0; i < len(cipherRunes); i++ {
		cipherChar := russianCharToInt(cipherRunes[i])
		keyChar := russianCharToInt(extendedKeyRunes[i])
		decryptedChar := (cipherChar - keyChar + 33) % 33
		result.WriteRune(intToRussianChar(decryptedChar))
	}

	return result.String()
}

// Encrypt - метод для шифрования
func (a *App) Encrypt(method, key, text string) string {
	switch method {
	case "railfence":
		// Извлекаем число из ключа
		intKey, err := ExtractNumberFromKey(key)
		if err != nil {
			return fmt.Sprintf("Ошибка: %v. Ключ должен содержать цифры", err)
		}

		if intKey <= 0 {
			return "Ошибка: ключ должен быть положительным числом"
		}

		result := EncryptRailFence(intKey, text)
		if result == "" {
			return "Ошибка шифрования: проверьте входные данные"
		}
		return result

	case "vigenere":
		result := EncryptVigenere(key, text)
		if result == "" {
			return "Ошибка шифрования: проверьте входные данные"
		}

		return result

	default:
		return "Неизвестный метод шифрования"
	}
}

// Правильная реализация дешифровки "Железнодорожная изгородь"
func DecryptRailFence(rails int, cipherText string) string {
	if rails <= 1 {
		return cleanEnglish(cipherText)
	}

	cleanCipher := cleanEnglish(cipherText)
	if cleanCipher == "" {
		return ""
	}

	n := len(cleanCipher)

	// Создаем матрицу для отслеживания позиций
	fence := make([][]bool, rails)
	for i := range fence {
		fence[i] = make([]bool, n)
	}

	// Отмечаем позиции символов в заборе
	rail := 0
	direction := 1
	for i := 0; i < n; i++ {
		fence[rail][i] = true

		rail += direction

		if rail == 0 || rail == rails-1 {
			direction = -direction
		}
	}

	// Заполняем матрицу символами из шифротекста
	result := make([]rune, n)
	pos := 0

	for i := 0; i < rails; i++ {
		for j := 0; j < n; j++ {
			if fence[i][j] {
				result[j] = rune(cleanCipher[pos])
				pos++
			}
		}
	}

	return string(result)
}

func (a *App) Decrypt(method, key, text string) string {
	switch method {
	case "railfence":
		// Извлекаем число из ключа
		intKey, err := ExtractNumberFromKey(key)
		if err != nil {
			return fmt.Sprintf("Ошибка: %v. Ключ должен содержать цифры", err)
		}

		if intKey <= 0 {
			return "Ошибка: ключ должен быть положительным числом"
		}

		result := DecryptRailFence(intKey, text)
		if result == "" {
			return "Ошибка дешифрования: проверьте входные данные"
		}
		return result

	case "vigenere":
		cleanKey := cleanRussian(key)

		if cleanKey == "" {
			return "Ошибка дешифрования: ключ должен содержать русские символыfff"
		}
		result := DecryptVigenere(cleanKey, text)

		if result == "" {
			return "Ошибка дешифрования: проверьте входные данные"
		}
		return result

	default:
		return "Неизвестный метод дешифрования"
	}
}

type FileData struct {
	Key  string
	Text string
}

// ReadKeyAndTextFromFile - читает ключ и текст из файла
// ReadKeyAndTextFromFile - читает ключ и текст из файла
func (a *App) ReadKeyAndTextFromFile(filePath string) (FileData, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return FileData{}, fmt.Errorf("ошибка чтения файла: %v", err)
	}

	content := string(data)
	lines := strings.SplitN(content, "\n", 2)

	result := FileData{}

	if len(lines) > 0 {
		result.Key = strings.TrimSpace(lines[0])
	}

	if len(lines) > 1 {
		result.Text = strings.TrimSpace(lines[1])
	}

	return result, nil
}

// SaveKeyAndResultToFile - сохраняет ключ и результат в файл
func (a *App) SaveKeyAndResultToFile(fileName, key, result string) error {
	if fileName == "" {
		return fmt.Errorf("имя файла не может быть пустым")
	}

	// Добавляем расширение .txt если его нет
	if !strings.HasSuffix(strings.ToLower(fileName), ".txt") {
		fileName = fileName + ".txt"
	}

	// Формат: первая строка - ключ, вторая строка - результат
	content := key + "\n" + result

	err := os.WriteFile(fileName, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("ошибка сохранения файла: %v", err)
	}

	return nil
}
