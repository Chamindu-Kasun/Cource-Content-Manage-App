# Firestore Indexes

This document explains the Firestore composite indexes required for optimal query performance in this application.

## Required Indexes

The `firestore.indexes.json` file defines composite indexes for the following collections:

### Units Collection
- **unit_number (ASC)**: Enables ordered retrieval of units

### Topics Collection
- **topic_order (ASC)**: Enables ordered retrieval of topics
- **unit_id (ASC) + topic_order (ASC)**: Enables filtering topics by unit with ordering

### Videos Collection
- **order_index (ASC)**: Enables ordered retrieval of videos
- **topic_id (ASC) + order_index (ASC)**: Enables filtering videos by topic with ordering

## Deploying Indexes

To deploy these indexes to your Firebase project:

1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Query Optimizations Implemented

### API Routes (`/app/api/units/route.ts`)
- **Before**: N+1 query problem - made separate queries for videos, notes, and questions for each topic
- **After**: Batch queries using Firestore's `in` operator to fetch content for up to 10 topics per query
- **Impact**: Reduced from potentially hundreds of queries to just a few batched queries

### Performance Benefits
1. **Reduced Read Operations**: Fewer Firestore read operations means lower costs
2. **Faster Response Times**: Parallel batch queries complete faster than sequential per-topic queries
3. **Better Scalability**: Handles units with many topics more efficiently

## Index Creation Timeline

Note: After deploying indexes, it may take a few minutes for Firebase to build them, especially if you have existing data. You'll see the status in the Firebase Console under Firestore > Indexes.
