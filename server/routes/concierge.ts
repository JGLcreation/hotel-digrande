import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to init Gemini client:', err);
  }
}

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const hotelKnowledge = `
You are the Head Concierge of 'The Grand Luxe Hotel & Resort', an ultra-luxury 5-star palace hotel.
Available Suites & Rooms:
1. Presidential Penthouse Suite ($1,850/night): 185 sqm, 4 guests, 360-degree ocean and skyline view, private jacuzzi terrace, 24/7 dedicated butler, private elevator, Rivolta Carmignani linens.
2. Deluxe Ocean Vista Suite ($450/night): 54 sqm, 2 guests, private teak balcony facing direct oceanfront, rain shower, aromatherapy.
3. Executive Grand Suite ($680/night): 78 sqm, 3 guests, panoramic city horizon, walnut workstation, 14th floor Executive Lounge access.
4. Private Garden Sanctuary Villa ($1,150/night): 130 sqm, 4 guests, private heated plunge pool, open-air alfresco shower, shaded sun pavilion, in-villa private chef.
5. Classic Heritage King Room ($320/night): 42 sqm, 2 guests, high coffered ceilings, clawfoot tub, tranquil fountain courtyard view.

Signature Amenities & Services:
- Airport Mercedes-Maybach Limousine Transfer ($140)
- Dom Pérignon Vintage Champagne & Oscietra Caviar Welcome ($290)
- 90-min Thermal Spa Massage & Vitality Pool Sanctuary ($220)
- 5-Course Michelin Dining Experience by Executive Chef Julian Laurent ($380 for two)
- Private 2-hour Sunset Coastal Yacht Charter ($650)
- Complimentary valeting, 24-hr room service, pillow menu with 6 varieties.

Style & Tone:
Gracious, sophisticated, warm, impeccably polite, and helpful. Always offer tailored recommendations based on the guest's desires (e.g., romantic anniversary, executive retreat, family relaxation, wellness getaway). Keep answers concise, elegant, and directly actionable.
`;

    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${hotelKnowledge}\n\nGuest Query: ${message}` }] }
        ]
      });

      const reply = response.text || 'It is an absolute pleasure to assist you at The Grand Luxe. How may our concierge team elevate your stay today?';
      return res.json({ reply });
    }

    // Heuristic luxury concierge fallback
    const lower = message.toLowerCase();
    let reply = "Welcome to The Grand Luxe Hotel & Resort. As your personal concierge, I am devoted to curating an unforgettable stay.";

    if (lower.includes('anniversary') || lower.includes('romantic') || lower.includes('couple') || lower.includes('honeymoon')) {
      reply = "For an unforgettable celebration, I warmly recommend our Private Garden Sanctuary Villa ($1,150/night) featuring a heated private plunge pool, secluded courtyard, and romantic alfresco rain shower. We can also arrange our Dom Pérignon & Caviar arrival welcome and a couple's restorative thermal spa journey.";
    } else if (lower.includes('suite') || lower.includes('presidential') || lower.includes('best') || lower.includes('luxury')) {
      reply = "Our crown jewel is the Presidential Penthouse Suite ($1,850/night), spanning 185 square meters on the top floor with 360-degree ocean panoramas, a private jacuzzi terrace, and your own dedicated 24-hour butler.";
    } else if (lower.includes('business') || lower.includes('work') || lower.includes('executive')) {
      reply = "Our Executive Grand Suite ($680/night) is exquisitely tailored for productivity and repose. It features an ergonomic walnut workstation, dual-line fiber connectivity, and exclusive access to our 14th-floor Executive Club Lounge with complimentary evening cocktails.";
    } else if (lower.includes('ocean') || lower.includes('view') || lower.includes('sea') || lower.includes('balcony')) {
      reply = "The Deluxe Ocean Vista Suite ($450/night) offers sublime morning light and a private teak balcony positioned directly over the azure bay. It is perfect for serene coastal contemplation.";
    } else if (lower.includes('spa') || lower.includes('massage') || lower.includes('relax')) {
      reply = "Our Grand Luxe Thermal Sanctuary features heated vitality pools, hydrotherapy mist chambers, and our renowned 90-minute restorative botanical massage ($220). We can reserve a private session at your preferred hour.";
    } else if (lower.includes('dining') || lower.includes('restaurant') || lower.includes('dinner') || lower.includes('food')) {
      reply = "Executive Chef Julian Laurent curates an extraordinary 5-course tasting menu at Le Belvédère ($380 for two). In-suite candlelit dining and 24-hour gourmet room service are also available at your whim.";
    } else if (lower.includes('check in') || lower.includes('check out') || lower.includes('time')) {
      reply = "Standard check-in commences at 15:00, and check-out is welcomed until 12:00 noon. Complimentary early arrivals or late check-outs are accommodated whenever suite availability permits.";
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Concierge route error:', err);
    return res.json({
      reply: 'It is our distinct pleasure to welcome you to The Grand Luxe. Please let our front desk concierge know your preferences for suites, dining, and spa treatments.'
    });
  }
});

export default router;
