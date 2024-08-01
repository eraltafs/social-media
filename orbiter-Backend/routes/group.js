const router = require("express").Router();
const Group = require("../controllers/group");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});


router.post("/createGroup", upload.single("profilePhoto"), Group.createGroup);
router.post("/getAllCommunityGroups", upload.none(), Group.getAllCommunityGroups);
router.post("/getMyCommunityGroups", upload.none(), Group.getMyCommunityGroups);
router.post("/joinGroup", upload.none(), Group.joinGroup);
router.post("/getDetail", upload.none(), Group.getGroup);
router.post("/likes_list", upload.none(), Group.likes_list);
router.post("/getMyjoinedGroups", upload.none(), Group.getMyjoinedGroups);
router.post("/sendGroupInvitation", upload.none(), Group.sendGroupInvitation);
router.get("/getGroupInvitation/:user_id", upload.none(), Group.getGroupInvitation);
router.post("/handleGroupInvitation", upload.none(), Group.handleGroupInvitation);
router.post("/exitGroup", upload.none(), Group.exitGroup);
router.post("/removeMember", upload.none(), Group.removeMember);
router.post("/createPost", upload.single("images"), Group.images);
router.post("/getPosts",upload.none(),Group.getPosts)
router.post("/updateGroup", upload.single("profilePhoto"), Group.updateGroup);
router.post("/deleteGroup", upload.single("profilePhoto"), Group.deleteGroup);
router.post("/like", upload.none(), Group.like);
router.post("/unlike", upload.none(), Group.unlike);
router.post("/comment", upload.none(), Group.comment);
router.post("/comment_alls", upload.none(), Group.comment_alls);
router.post("/comment_delete", upload.none(), Group.comment_delete);
router.post("/shareGroup", upload.none(), Group.shareGroup);

router.post("/getAddMembers", upload.none(),Group.getAllUser)


module.exports = router;
