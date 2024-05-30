function sevenBoom(arr){
if(/7/g.test(arr)){
    return 'Boom!'
}else{
  return "there is no 7 in the array";
}
}


console.log(sevenBoom([8, 6, 33, 100]))