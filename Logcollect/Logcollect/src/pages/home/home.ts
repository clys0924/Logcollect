import { Component } from '@angular/core';
import { NavController, Platform, AlertController } from 'ionic-angular';
import { File } from 'ionic-native';
import { Transfer } from 'ionic-native';
import { FileService } from './services'
declare var cordova: any;


//参数配置部分
var centraLinkip =   "http://192.168.1.113:3000/images/"  //centraLink端静态文件下载地址
var ftpIP = "192.168.1.113"  //上传文件服务器地址
var ftpUser = "kk"  //上传文件服务器用户名
var ftpPwd = "kk"   //上传文件服务器密码
var dategap = 10  //初始日期相差天数
var hospitalname = 'fzzyy'  //医院名称
var glob  //定义this为全局函数

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [FileService]
})


export class HomePage {
  initBtime:string;
  endBtime:string;
  constructor(public navCtrl: NavController, public platform: Platform, public alertCtrl: AlertController,
  private fileService:FileService){
    glob = this
  }
  
  //判断OS，选择下载目录
  os(){
    if (this.platform.is('ios')){
     return cordova.file.documentsDirectory;
    }
    else if(this.platform.is('android')){
     return cordova.file.externalRootDirectory;
    }
    else {
     return ''
    }}
    
  //配置提示弹窗
  showAlert(type,text) {
     let alert1 = this.alertCtrl.create({
        title: type,
        subTitle: text,
        buttons: ['确定']
      });
      alert1.present();
    }
   
  curentTime(dategap){  //获取当前时间，计算给定参数的日期
    var now = new Date();
    var before = new Date(now.getFullYear(),now.getMonth(),now.getDate()-dategap,now.getHours(),now.getMinutes(),now.getSeconds());
    var year = before.getFullYear(), month = before.getMonth()+1, day = before.getDate();
    var hh = before.getHours(), mm = before.getMinutes(), ss = before.getSeconds()
    var clock = year.toString();
    if(month < 10){clock += "0"}; clock += month.toString();
    if(day < 10){clock += "0"};   clock += day.toString();
    if(hh < 10){clock += "0"};    clock += hh.toString();
    if(mm < 10){clock += '0'};    clock += mm.toString();
    if(ss < 10){clock += '0'};    clock += ss.toString();
    return clock;
  }

  //HTML填入初始时间
  ngOnInit(){
    this.endBtime = glob.curentTime(0).substring(0,8)
    this.initBtime = glob.curentTime(dategap).substring(0,8)
  }

  //下载文件
  downloadImage(beginTime,endTime) {  //两参数分别为开始时间及结束时间
    this.platform.ready().then(() => {
      const fileTransfer = new Transfer();
      var fileList = this.fileService.getFiles(beginTime.value,endTime.value).map(res => res.json());  //获取文件列表
      var loop,file1 = [];
      fileList.forEach(function(file){  //循环文件列表
        return loop = parseInt(file.length),file1 = file
      }).then(() => {
        if (parseInt(loop) >= 1){
          this.showAlert("提示","开始下载文件，请等待下载结果提示");
          let k = 0;
          for (var i=0 ; i < parseInt(loop); i++){
            let image = file1[i].filename, imageLocation = centraLinkip + image, targetPath;  //定义文件名及远程地址
            targetPath = this.os()+'LogCollect/'+image;  //定义存放地址
            fileTransfer.download(imageLocation, targetPath)  //下载
            .then((entry) => {
              k++;  //计算成功文件数
              if (k === parseInt(loop)){  //均成功则提示
                this.showAlert("提示","下载完成")
            }},(error) => {
              alert(image+" 下载错误 "+error.code);
            });
          }
        } else {
          this.showAlert("错误","没有符合条件的文件")  //如无文件符合日期要求则提示
        }
      })
    });
  }
  
  //检查文件
  rmss:any[];
  check(beginTime,endTime){
    this.rmss = [];
    var fileList = this.fileService.getFiles(beginTime.value,endTime.value).map(res => res.json())  //获取文件列表
    var loop,file1 = [];
    fileList.subscribe(rmss => this.rmss = rmss);
    fileList.forEach(function(file){  //循环文件列表
      return loop = parseInt(file.length),file1 = file
    }).then(()=>{
      if (parseInt(loop) >= 1){
        this.showAlert("提示","开始检查文件...");
        let k = 0
        for (var i=0 ; i < parseInt(loop); i++){
          let image = file1[i].filename;
          File.checkFile(this.os()+'LogCollect/',image)
          .then(() => {
            k++;
            if (k === parseInt(loop)){
              this.showAlert("提示","文件均存在，检查结束")
            }})
          .catch(err => this.showAlert("错误",image+'文件不存在'));
        };
      } else {
        this.showAlert("错误","没有符合条件的文件")  //没有符合条件的文件列表则提示
      }
    })
  }

  //上传文件
  upload() {
    this.platform.ready().then(() => {
      let faillist = []  //上传失败列表
      let k = 0
      function transmit(result,uploadTime){  //传输数据
        cordova.plugin.ftp.connect(ftpIP,ftpUser,ftpPwd,function(ok){  //连接FTP
          try{cordova.plugin.ftp.mkdir('/'+hospitalname,function(ok){})}catch(err){alert('建立医院文件夹失败:'+err)}  //建立医院文件夹，独立一行
          try{cordova.plugin.ftp.mkdir('/'+hospitalname+'/'+uploadTime,function(ok){  //建立时间文件夹
            for (var i=0 ; i < result.length; i++){  //循环本地文件列表
              let image = result[i].name;
              cordova.plugin.ftp.upload(glob.os().substring(8)+'LogCollect/'+image,'/'+hospitalname+'/'+uploadTime+'/'+image,function(percent){  //上传文件
                if (percent == 1) {  //1代表上传完成100%
                  k++;
                  File.removeFile(glob.os()+'LogCollect/',image);
                  if (k == result.length && faillist.length == 0){
                    glob.showAlert("提示","所有文件上传成功")
                  }
                }
              },function(error){
                  k++;
                  faillist.push(image)  //失败添加至失败文件列表
                  alert('文件:'+image+'上传失败，原因是:'+error+'.请重新上传.')
                  if (k == result.length && faillist.length > 0){
                    glob.showAlert("错误","文件"+faillist+"上传失败，请重新上传")
                  }
              })
            }
          })}catch(err){alert('建立日期文件夹失败:'+err)}
        },function(err){
          alert("连接上传FTP失败:"+err)
          for (var i=0 ; i < result.length; i++){
            faillist.push(result[i].name)
          }
          if (faillist.length > 0){
            glob.showAlert("错误","文件"+faillist+"上传失败，请重新上传")
          }
        })
      }

      File.listDir(glob.os(),'LogCollect').then(result => {  //执行获取本地文件列表
          if(result.length > 0){
            var uploadTime = glob.curentTime(0)
            this.showAlert("提示","开始上传文件，请等待上传结果提示")
            transmit(result,uploadTime)
          } else {
            this.showAlert("错误","没有需要上传的文件")  //没有符合条件的文件列表则提示
          }
      })
    })
  }
}