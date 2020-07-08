<?php require_once('./include/header.php') ?>
  
  <!--======= CONTENT =========-->
  <div class="content fix-nav-space"> 
    
    <!--======= SUB BANNER =========-->
    <section class="sub-banner" data-stellar-background-ratio="0.5">
      <div class="overlay">
        <div class="container">
          <h3>Contato</h3>

          <!--======= Breadcrumbs =========-->
          <ol class="breadcrumb">
            <li><a href="index.php">Home</a></li>
            <li class="active">Contato</li>
          </ol>
        </div>
      </div>
    </section>
    
    <!--======= CONATCT =========-->
    <div class="contact">
      <div class="container">
        <div class="row">
          <div class="col-md-8"> 
            <h4>Envie uma mensagem</h4>
            
            <!--======= CONTACT FORM =========-->
            <div class="contact-form"> 
            
          
              
              <!--======= Success Msg =========-->
              
              
              <!--======= FORM  =========-->
              <div id="contact_message" class="success-msg"> <i class="fa fa-paper-plane-o"></i>Thank You. Your Message has been Submitted</div>
            <form role="form" id="contact_form" class="contact-form" method="post" onSubmit="return false">
              <ul class="row">
                <li class="col-sm-6">
                  <label>Nome *
                    <input type="text" class="form-control" name="name" id="name" placeholder="">
                  </label>
                </li>
                <li class="col-sm-6">
                  <label>E-mail *
                    <input type="text" class="form-control" name="email" id="email" placeholder="">
                  </label>
                </li>
                <li class="col-sm-6">
                  <label>Telefone *
                    <input type="tel" class="form-control" name="telefone" id="company" placeholder="">
                  </label>
                </li>
                <li class="col-sm-6">
                  <label>Assunto
                    <input type="text" class="form-control" name="assunto" id="assunto" placeholder="">
                  </label>
                </li>
                <li class="col-sm-12">
                  <label>Mensagem
                    <textarea class="form-control" name="mensagem" id="message" rows="5" placeholder=""></textarea>
                  </label>
                </li>
                <li class="col-sm-12">
                  <button type="submit" value="submit" class="btn" id="btn_submit" onClick="proceed();">Enviar</button>
                </li>
              </ul>
            </form>
              
            </div>
          </div>
          
          
          <div class="col-md-4">
          <h4>Horário de funcionamento</h4>
          	<!-- Timing -->
            <div class="timing">
              
              <p>Segunda a Sexta <span> 8h às 18h</span></p>
            </div>
            
            <!-- Follow Us -->
             <h4>Nos siga</h4>
            
            <ul class="social_icons">
              <li class="facebook"><a href="#."><i class="fa fa-facebook"></i> </a></li>
              <li class="twitter"><a href="#."><i class="fa fa-instagram"></i> </a></li>
              <li class="linkedin"><a href="#."><i class="fa fa-linkedin"></i> </a></li>

            </ul>
          </div>
        </div>
      </div>
    </div>
    
    
        <!--======= GOOGLE MAP =========-->
        <div id="map" class="g_map">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.1823747429203!2d-46.71064788459676!3d-23.525942084700574!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef888053bacdb%3A0x625eaa4e8b048d77!2sR.%20Thom%C3%A9%20de%20Souza%2C%20207%20-%20Lapa%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005079-000!5e0!3m2!1spt-BR!2sbr!4v1594060615884!5m2!1spt-BR!2sbr" width="100%" height="450" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>
        </div>
    
    <!--======= Contact Info =========-->
    <section class="contact-info">
      <div class="container"> 
        
        <!--Address-->
        <ul class="row">
          <li class="col-md-4"> <i class="ion-ios-location-outline"></i>
            <h5>Endereço</h5>
            <p>Rua Tomé de Souza, 207 - Alto da Lapa, São Paulo - SP</p>
          </li>
          
          <!-- Hot line -->
          <li class="col-md-4"> <i class="ion-iphone"></i>
            <h5>Telefone</h5>
            <p>3831.0713 / 3641.2323</p>
          </li>
          
          <!--Email Contact-->
          <li class="col-md-4"> <i class="ion-ios-email-outline"></i>
            <h5>E-mail</h5>
            <p>contato@clinicaalphamed.com.br</p>
          </li>
          
        </ul>
      </div>
    </section>
  </div>
  
  <!--======= FOOTER =========-->
  <?php require_once('./include/footer.php') ?>