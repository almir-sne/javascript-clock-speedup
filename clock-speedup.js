// Simulate a faster Date object.
// For example, if you wait one second, the date object could report a time difference of 10 seconds.
// Only the Date object will be affected, not setTimeout or setInterval.
// When creating a new Date object with year/month/day values but no time values the real time will be used as the result time, not the fake time.
// This code uses eval and is not save for production! It's meant to simulate real use for debugging purposes.

(function(){
    // from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/prototype#Methods
    // Can't get the list from the Date object because of DontEnum
    var dateInstanceMethods = [
        "getDate", "getDay", "getFullYear", "getHours", "getMilliseconds",
        "getMinutes", "getMonth", "getSeconds", "getTime", "getTimezoneOffset",
        "getUTCDate", "getUTCDay", "getUTCFullYear", "getUTCHours",
        "getUTCMilliseconds", "getUTCMinutes", "getUTCMonth", "getUTCSeconds",
        "getYear", "setDate", "setFullYear", "setHours", "setMilliseconds",
        "setMinutes", "setMonth", "setSeconds", "setTime", "setUTCDate",
        "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear",
        "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCMonth",
        "setUTCSeconds", "setYear", "toDateString", "toISOString", "toJSON",
        "toGMTString", "toLocaleString", "toLocaleFormat", "toLocaleString",
        "toLocaleTimeString", "toString", "toTimeString", "toUTCString",
        "valueOf"];

    var NativeDate = window.Date;
    var startDate = new NativeDate();
    var speedupFactor = 2.4;
    var factorAdjustment = 0; // used when the speedup factor changes and the startDate is reset....

    var CustomDate = function(){
        var args = [].slice.apply(arguments);
        var definedArgs = []; // need to filter because we use `args.join` later
        for (var i=0; i< args.length; i++)
        {
            if (args[i] !== undefined)
            {
                definedArgs.push(args[i]);
            }
        }
        var args = definedArgs;

        if (! (args[0] instanceof CustomDate))
        {
            var argString;
            if (typeof args[0] === "string") // Date constructor accepts strings too...
            {
                argString = '"' + args[0].replace(new RegExp('\"'), "\\\"") + '"';
            }
            else
            {
                argString = args.join(",");
            }
            // Use eval, because http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
            this.internalDate = eval("new NativeDate(" + argString + ")");
        }
        else
        {
            this.internalDate = new NativeDate(args[0].internalDate);
        }

        if (args.length === 0) // adjust to fake "now"
        {
            var realNowValue = this.internalDate.valueOf();
            var millisecondsSinceStart = realNowValue - startDate.valueOf();
            var fakeNowValue = realNowValue + factorAdjustment + millisecondsSinceStart * (speedupFactor -1); // -1 because realNowVal already contains the real time difference
            this.internalDate = new NativeDate(fakeNowValue);
        }
    };

    for (var i=0; i<dateInstanceMethods.length; i++)
    {
        (function(){ // wrap in closure to keep scope
            var methodName = dateInstanceMethods[i];
            CustomDate.prototype[methodName] = function(){
                return this.internalDate[methodName].apply(this.internalDate, arguments);
            };
        })();
    }

    // Static methods...
    CustomDate.now = function(){
        return new CustomDate();
    };
    CustomDate.parse = function(str){
        var date = new CustomDate(str);
        return date.valueOf();
    };
    CustomDate.UTC = function(year, month, date, hrs, min, sec, ms){
        var data = new CustomDate(year, month, date, hrs, min, sec, ms);
        return data.valueOf();
    };
    // -----------------

    CustomDate.NativeDate = NativeDate;
    CustomDate.setSpeedupFactor = function(factor){
        factorAdjustment = new CustomDate().valueOf() - startDate.valueOf();
        startDate = new NativeDate();
        speedupFactor = factor;
    };

    var showUi = true; // set to false by hideUi, in case document ready is triggered after calling hideUi
    var inputCss = {
        "display": "inline-block",
        "margin-left": "2px",
        "margin-right": "2px",
        "text-align": "center",
        "width": "70px"
    };

    if (window.jQuery) {
        var $ = window.jQuery;
        var container = $("<div>")
            .css({
                "position": "absolute",
                "top": "1px",
                "padding": "10px",
                "background": "#eee",
                "border": "1px solid #999",
                "left": "1px"
            });
        var hours = $("<input>")
            .attr({type: "number", value: 12})
            .css(inputCss);
        container.append($("<label>").text("Hours: "), hours);
        var minutes = $("<input>")
            .attr({type: "number", value: 0 })
            .css(inputCss);
        container.append($("<label>").text("Minutes: "), minutes);

        var nowDiv = $("<div>")
            .css("display", "inline-block");
        container.append(nowDiv);
        var speedupFactorInfo = $("<input>")
            .attr({type: "number", value: speedupFactor})
            .css(inputCss);
        var resetButton = $("<button>")
            .css("display", "inline-block")
            .css("font-size", "10px")
            .css("margin-left", "10px")
            .click(function () {
                CustomDate.setInterval(hours.val(), minutes.val(), speedupFactorInfo.val());
            })
            .text("Reset");

        container.append(speedupFactorInfo, resetButton);
        var nowDivInterval;
        CustomDate.setInterval = function(hours, minutes, speed) {
            if(nowDivInterval) {
                clearInterval(nowDivInterval);
            }
            var now = new CustomDate();
            var countDownDate = new CustomDate(now);
            countDownDate.setMinutes(countDownDate.getMinutes() + Number(hours) * 60 + Number(minutes));

            speedupFactor = Number(speed);

            nowDivInterval = setInterval(function () {
                var now = new CustomDate();

                // https://www.w3schools.com/howto/howto_js_countdown.asp
                // Find the distance between now an the count down date
                var distance = countDownDate - now;

                if (distance < 0) {
                    distance = 0;
                    document.getElementById("myAudio").play();
                    clearInterval(nowDivInterval);
                }

                // Time calculations for days, hours, minutes and seconds
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                // Display the result in the element with id="demo"
                nowDiv.text(days + "d " + hours + "h "
                    + minutes + "m " + seconds + "s ");
            }, 200);

            $(document).ready(function () {
                if (showUi) {
                    $("body").append(container);
                }
            })
        };

        CustomDate.setInterval(hours.val(), minutes.val(), speedupFactorInfo.val());
    }

    CustomDate.hideUi = function(){
        container.remove();
        showUi = false;
    };

    window.Date = CustomDate;
})();









