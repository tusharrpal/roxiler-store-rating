const express = require("express");
const router = express.Router();

const ownerController = require("../controllers/ownerController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.use(authenticate);
router.use(authorize("STORE_OWNER"));

router.get("/dashboard", ownerController.getDashboard);

router.put("/password", ownerController.updatePassword);

module.exports = router;