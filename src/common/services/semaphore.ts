import axios from "axios";
import { SEMAPHORE_KEY, SENDER_NAME } from "../../config/config";


type SemaphoreResponse<T = any> = {
  status: number;
  statusText: string;
  data: T;
};

const instance = axios.create({
  baseURL: "https://api.semaphore.co/api/v4/",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

function handleAxiosError(error: any): SemaphoreResponse {
  const status = error?.response?.status ?? 500;
  const statusText = error?.response?.statusText ?? "Request Failed";
  const data = error?.response?.data ?? {message: error?.messaga ?? "Unknown error"};
  return { status, statusText, data };
}

export async function sendMessage(number: string, message: string): Promise<SemaphoreResponse> {
  try {
    const response = await instance.post("messages",{
      apiKey: SEMAPHORE_KEY,
      number,
      message,
      senderName: SENDER_NAME
    });
    const { status , statusText, data } = response;
    return {status, statusText, data};
  } catch (error) {
    logging.error(`Error sending message on semaphore: ${error}`);
    return handleAxiosError(error);
  }
}

export async function sendOTPMessage(number: string): Promise<SemaphoreResponse<{code?: string}[]>>{
  try {

    const response = await instance.post("otp", {
      apiKey: SEMAPHORE_KEY,
      number,
      message: "Your OTP is: {otp}\nDo not share your otp with others",
      senderName: SENDER_NAME,
    });

    const { status , statusText, data } = response;
    return {status, statusText, data};

  } catch (error) {
    logging.error(`Error sending OTP message on semaphore: ${error}`);
    return handleAxiosError(error);
  }
}
