const express = require("express");
const Vimeo = require("vimeo").Vimeo;
const cors = require("cors"); // Import the cors package

const app = express();

const access_token = "abf3c5748d3b73fa439d95f5d5f5cd84";
const client_id = "ddcbb3bf9650cf2c7ec2d75c2ee4b69ac6a58b72";
const client_secret =
  "akmJ4cAZUFbXWXgYUaZrFsYUYvvwRkUUZYLhwUar2AUDxEgUvk9gC+oP2oUMrW0/zrXfd08PNDeEd2nggmX9NUxYBO5Wlx9k0SmU06BJB33pFK3E08+3a5zTogHEKgvx";

const vimeoClient = new Vimeo(client_id, client_secret, access_token);

// Enable CORS for all routes
app.use(cors());

// API endpoint to fetch video details
app.get("/api/videos/:videoId", (req, res) => {
  const videoId = req.params.videoId;

  vimeoClient.request(
    {
      method: "GET",
      path: `/videos/${videoId}`,
    },
    function (error, body) {
      if (error) {
        console.log(error);
        res
          .status(500)
          .json({ error: "An error occurred while fetching video details." });
      }

      res.json(body);
    }
  );
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
