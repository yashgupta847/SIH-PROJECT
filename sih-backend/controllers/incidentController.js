const Incident = require("../models/incident");

// Create new incident
const reportIncident = async (req, res) => {
  try {
    const { location, description } = req.body;

    const incident = await Incident.create({
      tourist: req.user._id, // from JWT middleware
      location,
      description,
    });

    // Real-time alert emit (socket)
    req.io.emit("alert", {
      message: "SOS Alert!",
      incident,
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all incidents (for authority dashboard)
const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ tourist: req.user._id }).populate("tourist", "name email");
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { reportIncident, getIncidents };
