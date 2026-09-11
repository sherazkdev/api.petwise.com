
class ApiError extends Error {
    public statusCode: number;
    public errors?: unknown[];
    public success: boolean;

    constructor( message:string, statusCode:number, success:boolean, errors?:unknown[] | undefined,stack?:string | undefined ){
        super(message);

        this.message = message || "Error: Something wrong.";
        this.statusCode = statusCode || 500;
        this.errors = errors || undefined;
        this.success = success || false;

        if(stack){
            this.stack = stack;
        }else {
            Error.captureStackTrace(this,ApiError)
        }
    }
}

export default ApiError;