const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.use(authenticate);
router.use(authorize("USER"));

router.get("/stores", userController.getStores);

router.post("/stores/:storeId/rating", userController.submitRating);

router.put("/password", userController.updatePassword);

module.exports = router;