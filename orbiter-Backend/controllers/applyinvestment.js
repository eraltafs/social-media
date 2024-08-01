const investment = require('../models/applyinvestment');

const investmentForm = async (req, res) => {
  try {
    // Extract data from the request body
    const { name,email,phone, location, about } = req.body;
 
    // Create a new feedback instance
    const newinvestment = new investment({
      name,
      email,
      phone,
      location,
      about
    });

    // Save the feedback to the database
    await newinvestment.save();

    // Respond with a success message
    res.json({ success: 1, message: 'submitted successfully' });
  } catch (error) {
    // If an error occurs, respond with an error message
    console.error('Error submitting :', error);
    res.status(500).json({ success: 0, message: 'Failed to submit ' });
  }
};
module.exports = {
  investmentForm
 };
