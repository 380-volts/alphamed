
<?php
if ($_SERVER[HTTP_REFERER] == "http://www.clinicaalphamed.com.br/" ||
    $_SERVER[HTTP_REFERER] == "https://www.clinicaalphamed.com.br/" || 
    $_SERVER[HTTP_REFERER] == "http://clinicaalphamed.com.br/" ||
    $_SERVER[HTTP_REFERER] == "https://clinicaalphamed.com.br/" ||
    $_SERVER[HTTP_REFERER] == "http://clinicaalphamed.com.br/contato.php" ||
    $_SERVER[HTTP_REFERER] == "https://clinicaalphamed.com.br/contato.php" ||
    $_SERVER[HTTP_REFERER] == "http://www.clinicaalphamed.com.br/contato.php" ||
    $_SERVER[HTTP_REFERER] == "https://www.clinicaalphamed.com.br/contato.php") {

    require_once("class.phpmailer.php");

    $mailer = new PHPMailer();
    $mailer->IsSMTP();
    $mailer->SMTPDebug = 1;
    $mailer->Port = 587; //Indica a porta de conexão para a saída de e-mails. Utilize obrigatoriamente a porta 587.

    $mailer->Host = 'mail.clinicaalphamed.com.br'; //Onde em 'servidor_de_saida' deve ser alterado por um dos hosts abaixo:
    //Para cPanel: 'mail.dominio.com.br';
    //Para Plesk 11 / 11.5: 'smtp.dominio.com.br';

    //Descomente a linha abaixo caso revenda seja 'Plesk 11.5 Linux'
    //$mailer->SMTPSecure = 'tls';

    $nome = addslashes($_POST[nome]);
    $email = addslashes($_POST[email]);
    $telefone = addslashes($_POST[telefone]);
	$assunto = addslashes($_POST[assunto]);
    $mensagem = addslashes($_POST[mensagem]);


    $mailer->SMTPAuth = true; //Define se haverá ou não autenticação no SMTP
    $mailer->Username = 'formulario@clinicaalphamed.com.br'; //Informe o e-mai o completo
    $mailer->Password = 'Alpha@380volts'; //Senha da caixa postal
    $mailer->FromName = 'Contato pelo site smyrnabrasil.com.br'; //Nome que será exibido para o destinatário
    $mailer->From = 'formulario@clinicaalphamed.com.br'; //Obrigatório ser a mesma caixa postal indicada em "username"
    $mailer->AddAddress('formulario@clinicaalphamed.com.br'); //Destinatários
    $mailer->Subject = 'Contato pelo site - ' . date("H:i") . '-' . date("d/m/Y");
    $mailer->Body = "Dados do contato

Nome: $nome

Email: $email

Telefone: $telefone

Assunto: $assunto

Mensagem de Contato: $mensagem";
    $mailer->CharSet = 'UTF-8';
    if (!$mailer->Send()) {
        echo "Mensagem não enviada";
        echo "Erro: " . $mailer->ErrorInfo;
        exit;
    } else {
        ?>
        <script>
            alert("Sua mensagem foi enviada com sucesso.");
            window.location = "http://www.clinicaalphamed.com.br/";
        </script>
    <?php
    }

}
else{
    ?>
    <script>
            alert("Acesso não autorizado");
            window.location = "http://www.clinicaalphamed.com.br/";
        </script>
   <?php
}

?>

