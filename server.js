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

  

  // Add possibility to return only pictures
  // /api/videos/12345?includePictures=true
  const includePictures = req.query.includePictures === 'true';

  const videoInfoCache = cache.get(videoId);

  //If videoId is not provided
  if (!videoId){
    res.status(401)
      .json({message : "Video ID not proved", code:"401"})
  }
  //if videoId is provided
  // check if video info is in cache
  if (videoInfoCache) {
    // if includePictures is true, return only pictures info
    if (includePictures){
      const { pictures } = videoInfoCache;
      res.status(200)
       .json({ pictures });
       // else return cached video info
    } else {
      const { name:videoName, description, link, player_embed_url, embed } = videoInfoCache;
        res.status(200)
            .json({name:videoName, description, link, player_embed_url, embed });
    }
    // if no cached info is found, make a request to vimeo API
  } else {
    vimeoClient.request(
    {
      method: "GET",
      path: `/videos/${videoId}`,
    },
    function (error, body) {
      // hanlde errors if any
      if (error) { 
        console.log(error);
        if (res.statusCode === 500 ){
            return res.status(500)
                    .json({ error: "Request error", 
                  code: "500"
                  });
        } else {
          return res.status(501)
                    .json({ error: "Unknown error ",
                  code: "501"
                  });
        }
      }
      // if response is not empty
      if(body){
        // if includePictures is true, return only pictures info
        if (includePictures){
          const { pictures } = body    
          cache.set(videoId, body);
          return res.status(200)
                    .json({ pictures});
        // else return video info
        } else {
          const { name:videoName, description, link, player_embed_url, embed } = body;
          // save video info in cache
          cache.set(videoId, body);
          return res.status(200)
                    .json({ name:videoName, description, link, player_embed_url, embed});
        }
      } else {
        return res.status(404)
                    .json({ error: "Content video information not found" });
      }}
    );
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
