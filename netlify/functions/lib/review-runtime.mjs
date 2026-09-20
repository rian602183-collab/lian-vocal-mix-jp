import { getStore } from '@netlify/blobs';
import { createReviewHandlers } from './review-server.mjs';
import { createKakaoReviewNotifier } from './review-kakao.mjs';

export function reviewHandlers() {
  return createReviewHandlers({
    store:getStore({name:'lian-reviews-v72',consistency:'strong'}),
    notifyReview:(record,links) => createKakaoReviewNotifier({
      tokenStore:getStore({name:'lian-kakao-auth',consistency:'strong'}),
    })(record,links),
  });
}
