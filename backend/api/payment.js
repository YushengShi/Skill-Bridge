import "dotenv/config";
import Stripe from "stripe";
import { Router } from "express";
import Booking from "../models/Booking.js";
import protect from "../middleware/auth.js";

const router = Router();

// This is your test secret API key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", protect, async (req, res) => {
  // TODO: replace this url
  const YOUR_DOMAIN = "http://localhost:5173"; // replace with frontend domain
  const { teacherId, lessonType, price, teacherName } = req.body;
  const studentId = req.userId;
  try {
    // 1. create a new booking in the database with status 'pending'
    const newBooking = await Booking.create({
      teacherId,
      studentId,
      lessonType,
      amount: price,
      status: "pending",
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
