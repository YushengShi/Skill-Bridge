// api/webhook.js

import "dotenv/config";
import Stripe from "stripe";
import { Router } from "express";
import Booking from "../models/Booking.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET; 

router.post("/", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // 注意：这里必须是 raw body
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理 Checkout Session 完成事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // 🌟 核心修改：直接从 metadata 读取 ID，不需要正则，不需要再次请求 Stripe
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      console.log(`✅ Payment received for Booking ID: ${bookingId}`);

      try {
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { status: 'paid' }, // 这里的状态要和你的 Schema 一致
          { new: true }
        );

        if (updatedBooking) {
            console.log(`🎉 Database updated! Booking status: ${updatedBooking.status}`);
        } else {
            console.log(`⚠️ Booking not found for ID: ${bookingId}`);
        }

      } catch (dbError) {
        console.error("Database update failed:", dbError);
      }
    } else {
      console.log('⚠️ No bookingId found in session metadata.');
    }
  }

  res.status(200).json({ received: true });
});

export default router;