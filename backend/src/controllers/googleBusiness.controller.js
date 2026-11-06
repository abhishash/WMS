// import GoogleAccount from "../models/GoogleAccount.js";
// import BusinessLocation from "../models/BusinessLocation.js";

// import {
//   getGoogleAccounts,
//   getBusinessLocations
// } from "../services/googleBusinessService.js";

// export const getConnectionStatus = async (req, res) => {
//   const account = await GoogleAccount.findOne({
//     userId: req.user.id,
//     connected: true
//   });

//   res.json({
//     success: true,
//     connected: !!account,
//     email: account?.googleEmail || null
//   });
// };

// export const syncBusinessLocations = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const [accounts, locations] = await Promise.all([
//       getGoogleAccounts(userId),
//       getBusinessLocations(userId)
//     ]);

//     const accountName = accounts[0]?.name || null;

//     const savedLocations = await Promise.all(
//       locations.map(async (location) => {
//         const saved = await BusinessLocation.findOneAndUpdate(
//           {
//             userId,
//             googleLocationId: location.name
//           },
//           {
//             userId,
//             googleLocationId: location.name,
//             googleAccountName: accountName,
//             businessName: location.title,
//             address: [
//               ...(location.storefrontAddress?.addressLines || []),
//               location.storefrontAddress?.locality,
//               location.storefrontAddress?.administrativeArea,
//               location.storefrontAddress?.postalCode
//             ].filter(Boolean).join(", "),
//             phone: location.phoneNumbers?.primaryPhone,
//             website: location.websiteUri,
//             primaryCategory:
//               location.categories?.primaryCategory?.displayName
//           },
//           {
//             upsert: true,
//             new: true
//           }
//         );

//         return saved;
//       })
//     );

//     res.json({
//       success: true,
//       total: savedLocations.length,
//       locations: savedLocations
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.response?.data || error.message
//     });
//   }
// };

// // Select a location for analytics
// export const selectBusinessLocation = async (req, res) => {
//   try {
//     const { locationId } = req.body;
//     const userId = req.user.id;

//     const location = await BusinessLocation.findOne({
//       userId,
//       googleLocationId: locationId
//     });

//     if (!location) {
//       return res.status(404).json({
//         success: false,
//         message: "Business location not found"
//       });
//     }

//     await BusinessLocation.updateMany(
//       { userId },
//       { $set: { selected: false } }
//     );

//     location.selected = true;
//     await location.save();

//     res.json({
//       success: true,
//       message: "Business location selected",
//       location
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

import axios from "axios";
import { getCustomerGoogleOAuthClient } from "../utils/googleAccountHelper.js";

// GET GOOGLE ACCOUNTS
export const getGoogleAccounts = async (req, res) => {
  try {
    const oauthClient = await getCustomerGoogleOAuthClient(req.user.id);

    const { token } = await oauthClient.getAccessToken();

    const { data } = await axios.get(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        params: {
          pageSize: 20,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res.status(200).json({
      success: true,
      accounts: data.accounts || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error(
      "Google accounts error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Google accounts",
    });
  }
};

// GET GOOGLE LOCATIONS
export const getGoogleLocations = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId || accountId.includes("/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google account ID",
      });
    }

    const oauthClient = await getCustomerGoogleOAuthClient(req.user.id);

    const { token } = await oauthClient.getAccessToken();

    const { data } = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`,
      {
        params: {
          pageSize: 100,
          readMask:
            "name,title,storefrontAddress,websiteUri,phoneNumbers,metadata",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res.status(200).json({
      success: true,
      locations: data.locations || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error(
      "Google locations error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Google locations",
    });
  }
};

export const selectGoogleLocation = async (req, res) => {
  try {
    const { accountId, locationName } = req.body;

    if (
      !accountId ||
      typeof accountId !== "string" ||
      !locationName ||
      typeof locationName !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Account and location are required"
      });
    }

    const match = locationName.match(/^locations\/([^/]+)$/);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google location resource name"
      });
    }

    const locationId = match[1];

    // Verify that the selected location belongs to
    // an account accessible to this customer.
    const oauthClient = await getCustomerGoogleOAuthClient(
      req.user.id
    );

    const { token } = await oauthClient.getAccessToken();

    const { data } = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`,
      {
        params: {
          readMask: "name,title,storefrontAddress"
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Deactivate previous selection for this user.
    await GoogleBusinessLocation.updateMany(
      { userId: req.user.id },
      { $set: { isSelected: false } }
    );

    const address = [
      data.storefrontAddress?.addressLines?.join(", "),
      data.storefrontAddress?.locality,
      data.storefrontAddress?.postalCode
    ].filter(Boolean).join(", ");

    const location = await GoogleBusinessLocation.findOneAndUpdate(
      {
        userId: req.user.id,
        accountId,
        locationId
      },
      {
        $set: {
          locationName: data.title || "Business",
          address,
          isSelected: true
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Business location selected",
      location
    });

  } catch (error) {
    console.error(
      "Select location error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to select business location"
    });
  }
};