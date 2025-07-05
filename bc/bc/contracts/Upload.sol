// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Upload {

  struct Access{
     string name;
     string photo;
     address addr; 
     bool access;
  }

  struct InsAccess{
     string name;
     string photo;
     address addr; 
  }

  struct File{
      string name;
      string hash;
  }

   struct User{
    string name;
    string photo;
    bool institute;
   }

  struct AllInstitue{
    string name;
    string photo;
    address addr;
  }

  AllInstitue[] allInstitues;
  mapping(address=>InsAccess[]) youHave;
  mapping(address=>User) personal;
  mapping(address=>File[]) value;
  mapping(address=>mapping(address=>bool)) ownership;
  mapping(address=>Access[]) accessList;
  mapping(address=>mapping(address=>bool)) previousData;
  
  function checkUserExists(address pubkey) public view returns(bool){
        return bytes(personal[pubkey].name).length > 0;
    }

  function createAccount(string calldata name,string calldata pho, bool inst) external {
        require(checkUserExists(msg.sender) == false, "User already exists");
        require(bytes(name).length>0, "Username cannot be empty");
        personal[msg.sender].name = name;
        personal[msg.sender].photo = pho;
        personal[msg.sender].institute = inst;
        if(inst){
            allInstitues.push(AllInstitue(name, pho, msg.sender));
        }
    }

  function getInfo() public view returns(User memory) {
        require(checkUserExists(msg.sender) == true, "User doesnt exists");
        //require(bytes(name).length>0, "Username cannot be empty");
       
        return personal[msg.sender];
    }

  function add(address _user, string memory n, string memory u) external {
      value[_user].push(File(n,u));
  }

  function getAllInstitutes() public view returns(AllInstitue[] memory){
        return allInstitues;
    }


  function allow(address user) external {//def
      ownership[msg.sender][user]=true; 
      if(previousData[msg.sender][user]){
         for(uint i=0;i<accessList[msg.sender].length;i++){
             if(accessList[msg.sender][i].addr==user){
                  accessList[msg.sender][i].access=true; 
             }
            
         }
         
      }else{
          
          for(uint i=0;i<allInstitues.length;i++)
          {
              if(user==allInstitues[i].addr)
              {
                  accessList[msg.sender].push(Access(allInstitues[i].name, allInstitues[i].photo, user, true)); 
              }
          }
          
          previousData[msg.sender][user]=true;  
      }
      bool y=false;
      for(uint i=0;i<youHave[user].length;i++)
      {
          if(youHave[user][i].addr == msg.sender)
          {
              y=true;
          }
      }
      if(y==false)
      {
          youHave[user].push(InsAccess(personal[msg.sender].name, personal[msg.sender].photo, msg.sender));
      }

  }
  function disallow(address user) public{
      ownership[msg.sender][user]=false;
      for(uint i=0;i<accessList[msg.sender].length;i++){
          if(accessList[msg.sender][i].addr==user){ 
              accessList[msg.sender][i].access=false;  
          }
      }
      for(uint i=0;i<youHave[user].length;i++)
      {
          if(youHave[user][i].addr==msg.sender)
          {
              delete youHave[user][i];
          }
      }

  }

  function display(address _user) external view returns(File[] memory){
      require(_user==msg.sender || ownership[_user][msg.sender],"You don't have access");
      return value[_user];
  }

  

  function getAccessList() public view returns(InsAccess[] memory)
  {
     return youHave[msg.sender]; 

  }

  function shareAccess() public view returns(Access[] memory){
      return accessList[msg.sender];
  }
}