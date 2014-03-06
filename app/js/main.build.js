define([
    'jquery', 'app'], function ($, app) {

    // Treat the jQuery ready function as the entry point to the application.
    // Inside this function, kick-off all initialization, everything up to this
    // point should be definitions.
    $(function () {
        app.start();
    });
});
