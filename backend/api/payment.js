import "dotenv/config";
import Stripe from "stripe";
import { Router } from "express";

const router = Router();

// This is your test secret API key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
    // TODO: replace this url
  const YOUR_DOMAIN = "http://localhost:5173"; // replace with frontend domain
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
        price: "price_1ScH4OLVqB101fVdlIwC9ei5",
        quantity: 2,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}/checkout?success=true`,
    cancel_url: `${YOUR_DOMAIN}/checkout?canceled=true`,
  });

  res.redirect(303, session.url);
});

export default router;