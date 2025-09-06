const express = require("express");
const router = express.Router();
const { reportIncident } = require("../controllers/incidentController");

const Incident = require("../models/incident");
const {protect} = require("../middleware/authMiddleware");

router.post("/report", protect, reportIncident);

// Get current tourist's incidents only
router.get("/", protect, async (req, res) => {
  try {
    const incidents = await Incident.find({ tourist: req.user._id }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
