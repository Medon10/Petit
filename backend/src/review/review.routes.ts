import { Router } from 'express';
import { submitReview, listProductReviews, getProductReviewSummary } from './review.controller.js';

export const reviewRouter = Router();

// Submit a new review (public, no auth)
reviewRouter.post('/', submitReview);

// List approved reviews for a product
reviewRouter.get('/product/:id', listProductReviews);

// Get review summary (average + count) for a product
reviewRouter.get('/product/:id/summary', getProductReviewSummary);
