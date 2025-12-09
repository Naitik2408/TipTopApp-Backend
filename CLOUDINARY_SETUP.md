# Cloudinary Setup Instructions

## Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Verify your email

## Step 2: Get Your Credentials
1. Login to your Cloudinary dashboard
2. Go to Dashboard → Settings → Product Environment Credentials
3. You'll find:
   - Cloud Name
   - API Key
   - API Secret

## Step 3: Create Upload Preset
1. Go to Settings → Upload
2. Scroll to "Upload presets" section
3. Click "Add upload preset"
4. Set:
   - Preset name: `menu_items`
   - Signing mode: `Unsigned` (important for frontend uploads)
   - Folder: `menu-items` (optional, for organization)
5. Save the preset

## Step 4: Update .env File
Update the following variables in `/Backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
CLOUDINARY_UPLOAD_PRESET=menu_items
```

## Step 5: Update Frontend Code
In `/The-Tip-Top/src/admin/pages/MenuManagement.jsx`, update the Cloudinary configuration in the `handleImageUpload` function (lines ~158-162):

Replace:
```javascript
formData.append('upload_preset', 'menu_items'); // Replace with your upload preset
formData.append('cloud_name', 'your_cloud_name'); // Replace with your cloud name

const response = await fetch(
  'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', // Replace with your cloud name
```

With your actual values:
```javascript
formData.append('upload_preset', 'menu_items'); // Your preset name
formData.append('cloud_name', 'YOUR_ACTUAL_CLOUD_NAME'); // Your cloud name

const response = await fetch(
  'https://api.cloudinary.com/v1_1/YOUR_ACTUAL_CLOUD_NAME/image/upload',
```

## Features Implemented

### Image Upload
- ✅ Click to upload from local files
- ✅ Drag and drop support
- ✅ Image preview before saving
- ✅ Option to paste URL directly
- ✅ File validation (type & size)
- ✅ Upload progress indicator

### Category Selection
- ✅ Checkbox-based multi-select
- ✅ Visual feedback on hover
- ✅ Selected count indicator
- ✅ Scrollable list for many categories
- ✅ Works in both Add and Edit modals

## File Size Limits
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, WebP

## Testing
1. Open Menu Management page
2. Click "Add Menu Item"
3. Try uploading an image
4. Verify image appears in preview
5. Save the item
6. Check if image URL is stored correctly

## Troubleshooting

### Upload fails with CORS error
- Make sure your upload preset is set to "Unsigned"
- Check that cloud name is correct

### Image not showing after upload
- Check browser console for errors
- Verify the secure_url is returned from Cloudinary
- Check if image URL is valid

### Large files fail
- Reduce image size before uploading
- Max file size is 5MB
- Use image compression tools if needed
