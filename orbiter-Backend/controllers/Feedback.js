const Feedback = require('../models/Feedback');
const User = require('../models/User');

const FeedbackForm = async (req, res) => {
  try {
    // Extract data from the request body
    const { user_id, thoughts, rating, Reccomend } = req.body;
    const user = await User.findById(user_id)
    if(!user){
      return res.json({ success: 0, message: 'user not found' });
    }
    // Create a new feedback instance
    const newFeedback = new Feedback({
      user_id,
      username:user.username,
      email:user.email,
      thoughts,
      rating,
      Reccomend
    });

    // Save the feedback to the database
    await newFeedback.save();

    // Respond with a success message
    res.json({ success: 1, message: 'Feedback submitted successfully' });
  } catch (error) {
    // If an error occurs, respond with an error message
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: 0, message: 'Failed to submit feedback' });
  }
};
module.exports = {
    FeedbackForm
 };
