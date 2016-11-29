var express = require('express');
var router = express.Router();
var fs = require('fs');
var moment = require("moment");

router.get('/:beginTime/:endTime', function(req, res, next) {
  var dirList = fs.readdirSync('public/images');
  fileList = [];
  dirList.forEach(function(item){
      let beginDate = moment(moment(req.params.beginTime+"000000","YYYYMMDDHHmmss")).format('YYYY-MM-DD HH:mm:ss')
      let endDate = moment(moment(req.params.endTime+"235959","YYYYMMDDHHmmss")).format('YYYY-MM-DD HH:mm:ss')
      let fileDate = moment(fs.statSync('public/images/'+item).ctime).format('YYYY-MM-DD HH:mm:ss')
      if (fileDate > beginDate && fileDate < endDate){
        fileList.push({filename: item})
      }
	});
  console.log(fileList)
  res.json(fileList)
});

module.exports = router;