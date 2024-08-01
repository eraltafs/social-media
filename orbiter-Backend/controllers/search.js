const User = require("../models/User");
const BlockedUser = require("../models/BlockedUser");
const ProfileVisit = require("../models/ProfileVisit");
const SearchHistory = require("../models/searchhistory");

const search = async (req, res) => {
  try {
    const { searchTerm, userId } = req.body;

    // Fetch the list of blocked users
    const blockedUsersData = await BlockedUser.findOne({ blockedBy: userId });
    const blockedContent = blockedUsersData ? blockedUsersData.blockedUser : [];

    // Create a case-insensitive regex for the search term
    const regex = new RegExp(searchTerm, "i");

    // Fetch users matching the search term and excluding blocked users
    const users = await User.find({
      _id: { $nin: blockedContent }, // Exclude blocked users
      $or: [{ first_name: regex }, { last_name: regex }, { username: regex }],
    }).select("first_name last_name name username avatar items type isverified").sort({ isverified: -1, followers: -1 });

    // Select relevant user data
    const selectedUsers = users.map((user) => ({
      user_id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      name:user.name,
      avatar: user.avatar,
      items: user.items[0],
      type: user.type,
      isverified: user.isverified,
    }));

    res.json({ success: 1, users: selectedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: 0, message: "Internal server error" });
  }
};

const searchhistory = async (req, res) => {
  try {
    const { user_id, search_id } = req.body;

    // Fetch blocked users data
    const blockedUsersData = await BlockedUser.findOne({ blockedBy: user_id });
    const blockedContent = blockedUsersData ? blockedUsersData.blockedUser : [];

    // Check if the search_id is blocked
    if (blockedContent.includes(search_id))
      return res.json({ success: 1, message: "Blocked user" });

    // Prevent the user from adding their own user_id
    if (user_id === search_id)
      return res.json({
        success: 1,
        message: "Cannot insert your own user_id",
      });

    // Fetch or create a search history entry
    const searchHistory = await SearchHistory.findOneAndUpdate(
      { user_id },
      { $addToSet: { search_ids: search_id } }, // Add search_id if it doesn't exist
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Check if the search_id already exists in the search_ids array
    if (searchHistory.search_ids.includes(search_id))
      return res.json({ success: 1, message: "Search id already exists" });

    // Update search_ids array and keep only the latest 10 search_ids
    searchHistory.search_ids.push(search_id);
    if (searchHistory.search_ids.length > 10) searchHistory.search_ids.shift();

    await searchHistory.save();

    return res.json({
      success: 1,
      message: "Search history updated successfully",
    });
  } catch (error) {
    console.error("Error updating search history:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchSavedSearchData = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if the user has a search history entry
    const searchHistory = await SearchHistory.findOne({ user_id });

    if (!searchHistory)
      return res.json({
        success: 1,
        message: "No search history found for the user",
      });

    // Fetch data for each saved search_id and handle null scenarios
    const searchDataPromises = searchHistory.search_ids.map(
      async (savedSearchId) => {
        const userData = await User.findById(savedSearchId).select(
          "first_name last_name type isverified avatar username items image name"
        );

        if (!userData) {
          console.log(`No user found for search_id: ${savedSearchId}`);
          return null;
        }

        return {
          ...userData._doc,
          items: userData.items[0],
        };
      }
    );

    // Wait for all data promises to resolve and filter out null results
    const searchDataResults = (await Promise.all(searchDataPromises)).filter(
      (data) => data !== null
    );

    res.json({
      success: 1,
      message: "Search data fetched successfully",
      searchData: searchDataResults,
    });
  } catch (error) {
    console.error("Error fetching search data:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

const profile_visit = async (req, res) => {
  try {
    const { user_id, profile_id } = req.body;

    // Fetch blocked users data
    const blockedUsersData = await BlockedUser.findOne({ blockedBy: user_id });
    const blockedContent = blockedUsersData ? blockedUsersData.blockedUser : [];

    // Check if the profile_id is blocked
    if (blockedContent.includes(profile_id))
      return res.json({ success: 1, message: "Blocked user" });

    // Prevent the user from adding their own user_id as profile_id
    if (user_id === profile_id)
      return res.json({ success: 1, message: "Owner's ID cannot be inserted" });

    // Check if a profile visit already exists for the user and profile
    let existingVisit = await ProfileVisit.findOne({ user_id, profile_id });

    // If a visit already exists, update the existing visit
    if (existingVisit) {
      existingVisit.date = new Date(); // Update the date to the current date
      await existingVisit.save();
    } else await ProfileVisit.create({ user_id, profile_id });

    res.json({ success: 1, message: "Profile visit recorded successfully" });
  } catch (error) {
    console.error("Error recording profile visit:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

const saved_profile = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch profile visit entries for the user
    const profileVisits = await ProfileVisit.find({ profile_id: user_id })
      .populate("user_id", [
        "first_name",
        "name",
        "last_name",
        "type",
        "isverified",
        "avatar",
        "username",
        "items",
        "designation",
      ])
      .sort({ date: -1 });

    if (!profileVisits || profileVisits.length === 0)
      return res.json({
        success: 1,
        message: "No profile visits found for the user",
      });

    const modifiedProfileVisits = profileVisits.map((visit) => ({
      ...visit.toObject(),
      user_id: {
        ...visit.user_id.toObject(),
        items: visit.user_id.items[0],
      },
    }));

    return res.json({
      success: 1,
      message: "Profile visit data fetched successfully",
      profileVisits: modifiedProfileVisits,
    });
  } catch (error) {
    console.error("Error fetching profile visit data:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

module.exports = {
  search,
  searchhistory,
  fetchSavedSearchData,
  profile_visit,
  saved_profile,
};
