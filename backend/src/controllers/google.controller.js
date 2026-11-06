import AppError from "../utils/appError.js";
import {
  fetchGoogleAccounts,
  getConnectedGoogleAccounts,
  getGoogleClient,
} from "../services/googleAccount.service.js";
import { fetchLocations } from "../services/googleLocation.service.js";

export async function getAccounts(req, res) {
  const connectedAccounts = await getConnectedGoogleAccounts(req.user.id);
  const data = await Promise.all(
    connectedAccounts.map(async (googleAccount) => {
      const { account, oauth } = await getGoogleClient(
        req.user.id,
        googleAccount._id,
      );
      const accounts = await fetchGoogleAccounts(account, oauth);

      return {
        googleAccountId: String(googleAccount._id),
        email: googleAccount.email,
        accounts: accounts.map((businessAccount) => ({
          name: businessAccount.name,
          accountName: businessAccount.accountName,
          type: businessAccount.type,
          role: businessAccount.role,
        })),
      };
    }),
  );

  res.json({ success: true, data });
}

export async function getLocations(req, res) {
  const { googleAccountId, accountId } = req.query;

  if (typeof googleAccountId !== "string" || typeof accountId !== "string") {
    throw new AppError(
      "Google account and Business Profile account are required",
      400,
      "MISSING_GOOGLE_ACCOUNT",
    );
  }

  const { account, oauth } = await getGoogleClient(
    req.user.id,
    googleAccountId,
  );
  const locations = await fetchLocations(account, oauth, accountId);
  res.json({ success: true, data: locations });
}
