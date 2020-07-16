var timeFunc = {
    msg_time: function(date){
        var timeString = "";
        var hour = date.getHours();
        var minute = date.getMinutes();
        if(hour<12){
            if(hour==0)
                timeString += "오전 12";
            else
                timeString += ("오전 " + hour.toString());
        }
        else{
            if(hour==12)
                timeString += "오후 12";
            else
                timeString += ("오후 " + (hour-12).toString());
        }
        if(minute<10)
            timeString += (":" + "0" + minute.toString());
        else
            timeString += (":" + minute.toString());
        return timeString;
    },
    msg_date: function(date){
        var dateString = date.getFullYear().toString() + "년 " + (date.getMonth()+1).toString() + "월 "
            + date.getDate().toString() + "일";
        return dateString;
    },
    s3_dateTime: function(date){
        var datetimeString = date.getFullYear().toString();
        var month = date.getMonth() + 1;
        if(month<10)
            datetimeString += ("0" + month.toString());
        else
            datetimeString += month.toString();
        var day = date.getDate();
        if(day<10)
            datetimeString += ("0" + day.toString());
        else
            datetimeString += day.toString();
        var hour = date.getHours();
        if(hour<10)
            datetimeString += ("0" + hour.toString());
        else
            datetimeString += hour.toString();
        var minute = date.getMinutes();
        if(minute<10)
            datetimeString += ("0" + minute.toString());
        else
            datetimeString += minute.toString();
        var sec = date.getSeconds();
        if(sec<10)
            datetimeString += ("0" + sec.toString());
        else
            datetimeString += sec.toString();
        var msec = date.getMilliseconds();
        if(msec<10)
            datetimeString += ("00" + msec.toString());
        else if(msec<100)
            datetimeString += ("0" + msec.toString());
        else
            datetimeString += msec.toString();
        return datetimeString;
    }
};

module.exports=timeFunc;
