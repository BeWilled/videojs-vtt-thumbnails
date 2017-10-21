# videojs-vtt-thumbnails
VTT implementation of mousehover thumbnails for videojs

Just import your .vtt file and you should be good to go

Example:

    <link href="https://cdnjs.cloudflare.com/ajax/libs/video.js/6.3.3/video-js.min.css" rel="stylesheet">
    <link href="videojs.vtt.thumbnails.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/video.js/6.3.3/video.min.js"></script>
    <script type="text/javascript" src="videojs.vtt.thumbnails.js"></script>

    <video
            id="my-player"
            class="video-js"
            controls
            preload="auto"
            data-setup='{}'>
        <source src="video.mp4" type="video/mp4"></source>
    </video>

    <script>
      var video = videojs('my-player', {}, function(){
        this.thumbnails({ 'src' : 'path/to/my/file.vtt' });
      });

    </script>
