const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", adminController.getDashboard);

router.post("/users", adminController.createUser);

router.post("/stores", adminController.createStore);

router.get("/users", adminController.getUsers);

router.get("/stores", adminController.getStores);

router.get("/users/:id", adminController.getUserById);

router.put("/password", adminController.updatePassword);

module.exports = router;