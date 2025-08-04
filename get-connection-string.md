# How to Get the Correct MongoDB Connection String

1. **Go to MongoDB Atlas Dashboard**
   - Open https://cloud.mongodb.com
   - Sign in to your account

2. **Navigate to Your Cluster**
   - Click on "Database" in the left sidebar
   - Click on your cluster (should be named something like "Cluster2")

3. **Get Connection String**
   - Click the "Connect" button
   - Choose "Connect your application"
   - Select "Node.js" as the driver
   - Copy the connection string

4. **Update the Connection String**
   - Replace `<password>` with your actual password: `digitalemanmedium2289`
   - Replace `<dbname>` with `eman_clinic` if needed

5. **Check Cluster Name**
   - Make sure the cluster name in the URL matches your actual cluster name
   - The cluster name might not be "Cluster2" - check what it actually is

6. **Check Database Access**
   - Go to "Database Access" in the left sidebar
   - Verify the user "EmanMediumClinic" exists and has proper permissions
   - Should have "Read and write to any database" permissions

7. **Check Network Access**
   - Go to "Network Access" in the left sidebar
   - Verify `0.0.0.0/0` is in the IP Access List
   - Status should be "Active"

## Common Issues:
- **Cluster is paused**: Resume it from the dashboard
- **Wrong cluster name**: Use the actual cluster name from your dashboard
- **User permissions**: Make sure the database user has proper access
- **Password encoding**: Special characters in password might need URL encoding 