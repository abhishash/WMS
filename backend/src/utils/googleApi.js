import AppError from "./appError.js";

export async function sendGoogleRequest(request) {
  try {
    return await request;
  } catch (error) {
    const message = error.response?.data?.error?.message ?? "The Google Business Profile request failed";
    throw new AppError(message, 502, "GOOGLE_API_ERROR");
  }
}
