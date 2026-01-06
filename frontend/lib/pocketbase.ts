import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Disable auto-cancellation to prevent issues
pb.autoCancellation(false);

export default pb;
