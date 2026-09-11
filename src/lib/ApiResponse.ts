class ApiResponse {
    public data: unknown;
    public message: string;
    public statusCode?: number;
    public success?: boolean;

    constructor(data:unknown, message:string, statusCode?:number, success?:boolean){
        this.data = data;
        this.message = message;
        this.statusCode = statusCode || 200;
        this.success = success || true;
    }
};
export default ApiResponse;