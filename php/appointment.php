<?php
if ((isset($_POST['name'])) && (strlen(trim($_POST['name'])) > 0)) {
    $name = stripslashes(strip_tags($_POST['name']));
} else {
    $name = 'No name entered';
}
if ((isset($_POST['email'])) && (strlen(trim($_POST['email'])) > 0)) {
    $email = stripslashes(strip_tags($_POST['email']));
} else {
    $email = 'No email entered';
}
if ((isset($_POST['phone'])) && (strlen(trim($_POST['phone'])) > 0)) {
    $phone = stripslashes(strip_tags($_POST['phone']));
} else {
    $phone = 'No phone entered';
}
if ((isset($_POST['date'])) && (strlen(trim($_POST['date'])) > 0)) {
    $date = stripslashes(strip_tags($_POST['date']));
} else {
    $date = 'No entered';
}
if ((isset($_POST['select1'])) && (strlen(trim($_POST['select1'])) > 0)) {
    $select1 = stripslashes(strip_tags($_POST['select1']));
} else {
    $select1 = 'No entered';
}
if ((isset($_POST['message'])) && (strlen(trim($_POST['message'])) > 0)) {
    $message = stripslashes(strip_tags($_POST['message']));
} else {
    $message = 'No message entered';
}
ob_start();
?>
<html>
<head>
</head>
<body>
<table width="100%" border="0" cellspacing="0" cellpadding="15">
    <tr bgcolor="#eeffee">
        <td>Name</td>
        <td><?php echo $name; ?></td>
    </tr>
    <tr bgcolor="#eeeeff">
        <td>Email</td>
        <td><?php echo $email; ?></td>
    </tr>
    <tr bgcolor="#eeffee">
        <td>Phone</td>
        <td><?php echo $phone; ?></td>
    </tr>
    <tr bgcolor="#eeeeff">
        <td>Date</td>
        <td><?php echo $date; ?></td>
    </tr>
    <tr bgcolor="#eeffee">
        <td>Department Type</td>
        <td><?php echo $select1; ?></td>
    </tr>
    <tr bgcolor="#eeeeff">
        <td>Message</td>
        <td><?php echo $message; ?></td>
    </tr>
    
</table>
</body>
</html>
<?php
$body = ob_get_contents();



$to = 'adnanarf@gmail.com';     //$anotheraddress = 'email@example.com';

$toname = 'Adnan Arif';		   //$anothername = 'Another Name';




require("phpmailer.php");

$mail = new PHPMailer();

$mail->From = $email;
$mail->FromName = $name;
$mail->AddAddress($to, $toname); // Put your email
//$mail->AddAddress($anotheraddress,$anothername); // addresses here

$mail->WordWrap = 50;
$mail->IsHTML(true);

$mail->Subject = "Client Appoitment";
$mail->Body = $body;
$mail->AltBody = $message;

if (!$mail->Send()) {
    $recipient = $to;
    $subject = 'Appoitment form failed';
    $content = $body;
    mail($recipient, $subject, $content, "From: $name\r\nReply-To: $email\r\nX-Mailer: DT_formmail");
    exit;
}
?>
