#!/bin/bash

# Start Next.js in the background
npm start &
 
# Start nginx in the foreground
nginx -g 'daemon off;' 