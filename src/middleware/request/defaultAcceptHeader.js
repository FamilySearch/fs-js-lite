// Set the Accept header if it's missing on /platform URLs
export default (client, request, next) => {
  if(!request.hasHeader('Accept') && request.isPlatform()){
    request.setHeader('Accept', 'application/x-fs-v1+json');
  }
  next();
};