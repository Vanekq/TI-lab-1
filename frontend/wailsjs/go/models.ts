export namespace main {
	
	export class FileData {
	    Key: string;
	    Text: string;
	
	    static createFrom(source: any = {}) {
	        return new FileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Key = source["Key"];
	        this.Text = source["Text"];
	    }
	}

}

