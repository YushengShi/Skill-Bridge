import "dotenv/config";
import Stripe from "stripe";
import { Router } from "express";
import Booking from "../models/Booking.js";
import protect from "../middleware/auth.js";

const router = Router();

// This is your test secret API key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @swagger
 * /api/payment/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     description: |
 *       Creates a new booking and Stripe checkout session for lesson payment.
 *       Returns a Stripe checkout URL to redirect the user for payment.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutSessionRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutSessionResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error or Stripe error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/create-checkout-session", protect, async (req, res) => {
  // TODO: replace this url
  const YOUR_DOMAIN = "http://localhost:5173"; // replace with frontend domain
  const { teacherId, lessonType, price, teacherName, scheduledDate, scheduledTime } = req.body;
  const studentId = req.userId;
  try {
    // 1. create a new booking in the database with status 'pending'
    const newBooking = await Booking.create({
      teacherId,
      studentId,
      lessonType,
      amount: price,
      status: "pending",
      // Store date correctly - when scheduledDate is "YYYY-MM-DD", 
      // create a date at UTC midnight to avoid timezone issues
      // This ensures "2024-12-13" is always stored as Dec 13 UTC, regardless of server timezone
      scheduledDate: scheduledDate 
        ? (() => {
            const [year, month, day] = scheduledDate.split('-').map(Number);
            // Create date at UTC midnight for the selected date
            // This prevents timezone shifts when MongoDB stores/retrieves the date
            return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
          })()
        : null,
      scheduledTime: scheduledTime || null,
      duration: lessonType === "trial" ? 30 : 60,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${lessonType.toUpperCase()} Lesson with ${teacherName}`,
              description: `Booking ID: ${newBooking._id}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      metadata: {
        bookingId: newBooking._id.toString(),
      },

      success_url: `${YOUR_DOMAIN}/teachers?success=true&bookingId=${newBooking._id}`,
      cancel_url: `${YOUR_DOMAIN}/teachers?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
