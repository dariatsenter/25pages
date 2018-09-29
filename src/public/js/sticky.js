$(window).bind("load", function() { 
       
       var footerHeight = 0,
           footerTop = 0,
           $footer = $("#sticky");
           
       positionFooter();
       
       function positionFooter() {
                //50px
                footerHeight = $footer.height();
                footerTop = ($(window).scrollTop()+$(window).height()-footerHeight)+"px";
                console.log('window height' + $(window).height());
                console.log('doc height' + $(document).height());
                console.log('doc body height' + $(document.body).height());
                console.log('footerTOp' + footerTop);
       
               if ( ($(document.body).height()+footerHeight) < $(window).height()) {
                console.log('absolute');
                   $footer.css({
                        position: "absolute"
                   }).animate({
                        top: footerTop
                   })
               } else {
                console.log('static');
                console.log('footerTop' + footerTop);
                   $footer.css({
                        position: "static"
                   })
               }
               
       }

       $(window)
               .scroll(positionFooter)
               .resize(positionFooter)
               
});