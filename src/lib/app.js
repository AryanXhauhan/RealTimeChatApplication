import React, { useState } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';
import axios from 'axios';

const App = () => {
  const cld = new Cloudinary({ cloud: { cloudName: 'dju66szv8' } });
  const [image, setImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const img = cld
    .image('cld-sample-5')
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(500).height(500));

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
    setError(''); // Clear any previous errors when a new file is selected
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!image) {
      setError('Please select an image to upload.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', 'your_upload_preset'); // Replace with your upload preset

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/dju66szv8/image/upload', formData);
      setUploadedImageUrl(response.data.secure_url); // Store the full URL
      setError('');
    } catch (error) {
      setError('Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>

      {/* Display error message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display Uploaded Image */}
      {uploadedImageUrl && (
        <div>
          <h3>Uploaded Image:</h3>
          <img src={uploadedImageUrl} alt="Uploaded" style={{ width: '500px', height: '500px' }} />
        </div>
      )}

      {/* Display Transformed Sample Image */}
      <div>
        <h3>Sample Transformed Image:</h3>
        <AdvancedImage cldImg={img} />
      </div>
    </div>
  );
};

export default App;
