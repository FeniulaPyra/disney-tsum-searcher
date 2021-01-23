<?php
$action = "getalltsums";
$url = "https://disneytsumtsum.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Tsums&cmlimit=max";
if(array_key_exists("action", $_GET)) $action = $_GET["action"];

$ids = "";

if($action != "getalltsums") {
	if(array_key_exists("ids", $_GET)) $ids = $_GET["ids"];
	if($action == "gettsumcategories") {
		$url = "https://disneytsumtsum.fandom.com/api.php?action=query&format=json&prop=categories&cllimit=max&pageids=" . $ids;
	}
	if($action == "gettsumdetails") {
		$url = "https://disneytsumtsum.fandom.com/api/v1/Articles/Details?ids=" . $ids;
	}
	if($action == "getbycategory") {
		$category = "Tsums";
		if(array_key_exists("category", $_GET)) $category = $_GET["category"];
		$url = "https://disneytsumtsum.fandom.com/api.php?action=query&format=json&cmlimit=max&list=categorymembers&cmtitle=Category:" . $category;
	}
}


header("content-type: application/json");
header("Access-Control-Allow-Origin: *");

echo file_get_contents($url);
?>