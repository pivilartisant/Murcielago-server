const express = require("express");
const NodeCache = require('node-cache');
const app = express();
const cache = new NodeCache();


require('dotenv').config({path: '.env'})


const Vimeo = require("vimeo").Vimeo;
const cors = require("cors"); // Import the cors package
const rateLimit = require("express-rate-limit");


const access_token = process.env.VIMEO_ACCESS_TOKEN;
const client_id = process.env.VIMEO_CLIENT_ID;
const client_secret = process.env.VIMEO_CLIENT_SECRET;

const vimeoClient = new Vimeo(client_id, client_secret, access_token);
// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 	250, // Max 250 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(cors());
app.set("trust proxy", 1);
app.use(limiter);




// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof rateLimit.RateLimitError) {
    res
      .status(429)
      .json({ error: "Rate limit exceeded. Please try again later." });
  } else {
    // Handle other errors
    res.status(500).json({ error: "Something went wrong during rate limitation." });
  }
});

//Requests to vimeo API 
app.get("/api/videos/:videoId", (req, res) => {
  const videoId = req.params.videoId;
  const videoInfoCache = cache.get(videoId);
  if (!videoId){
    res.status(404)
      .json({error : "Video ID not found"})
  }
  if (videoInfoCache) {
    res.status(200)
       .json({ data: videoInfoCache });
  } else {
    vimeoClient.request(
    {
      method: "GET",
      path: `/videos/${videoId}`,
    },
    function (error, body) {
      if (error) { 
        console.log(error);
        if (res.statusCode === 500 ){
            return res.status(500)
                    .json({ error: "Request error" });
        } else {
          return res.status(501)
                    .json({ error: "Unknown error "});
        }}
      if(body){
        cache.set(videoId, body);
         return res.status(200)
                   .json(body);
      } else {
        return res.status(404)
                    .json({ error: "Content video information not found" });
      }}
    );
  }
});


// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
