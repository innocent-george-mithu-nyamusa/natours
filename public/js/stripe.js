/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51GqmuKDxfQhvhY0EGbD8BTuHQjqrhx0D728kaRP6HtxUVAA7TizuZRn1EQufsgbCmcemSSBSuWINIuUcIIKXUjw400yDEQ2Ndp');

export const bookTour = tourId => {
    try{
        // 1.) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        // Create Checkout form + change credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }catch(err){
        showAlert('error', err)
    }

}
