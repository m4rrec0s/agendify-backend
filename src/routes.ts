// src/routes.ts
import { Router } from "express";
import AuthController from "./controllers/authController";
import UserController from "./controllers/userController";
import { verifyToken } from "./middleware/authMiddleware";
import { upload } from "./config/multer";
import appointmentController from "./controllers/appointmentController";
import businessController from "./controllers/businessController";
import categoryController from "./controllers/categoryController";
import serviceController from "./controllers/serviceController";

const router = Router();

// ============== Auth Routes ==============
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/google-login", AuthController.googleLogin);
router.get("/auth/me", verifyToken, AuthController.getMe);

// ============== User Routes ==============
router.put(
  "/user/profile",
  verifyToken,
  upload.single("image"),
  UserController.updateUser
);
router.get("/users", UserController.getAllUsers);
router.get("/user/:id", UserController.getUserById);
router.delete("/user/:id", verifyToken, UserController.deleteUser);

// ============== Business Routes ==============
router.post(
  "/owner/business",
  verifyToken,
  upload.single("image"),
  businessController.createBusiness
);
router.get("/business/:id", businessController.getBusinessById);
router.get("/business", businessController.getAllBusinesses);
router.put(
  "/business/:id",
  verifyToken,
  upload.single("image"),
  businessController.updateBusiness
);
router.delete("/business/:id", verifyToken, businessController.deleteBusiness);

// ============== Category Routes ==============
router.post("/category", verifyToken, categoryController.createCategory);
router.get("/categories", categoryController.getCategories);
router.put("/category/:id", categoryController.updateCategory);
router.delete("/category/:id", categoryController.deleteCategory);

// ============== Appointment Routes ==============
router.post(
  "/user/appointment",
  verifyToken,
  appointmentController.createAppointment
);
router.get(
  "/user/appointments",
  verifyToken,
  appointmentController.getAppointments
);

// ================ Service Routes ================
router.post(
  "/services",
  verifyToken,
  upload.single("image"),
  serviceController.createService
);
router.put(
  "/services/:id",
  verifyToken,
  upload.single("image"),
  serviceController.updateService
);
router.get("/services/:id", serviceController.getService);
router.get(
  "/businesses/:businessId/services",
  serviceController.getServicesByBusiness
);
router.delete("/services/:id", verifyToken, serviceController.deleteService);

export default router;
