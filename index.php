<?php require_once('./include/header.php') ?>
  
  <!--======= BANNER =========-->
  <div id="banner" class="full-screen">
    <div class="main-bnr">
      <div class="container">
        <div class="row">
          <div class="col-md-6 no-padding"> 
            
            <!--======= BANNER TEXT =========-->
            <div class="main-bnr-text">
              <h5>AlphaMed</h5>
              <h1>Cuidar da sua saúde é nossa maior especialidade</h1>
              <!--======= BUTTON =========--> 
              <a href="#." class="btn btn-1">Agendar consulta</a> </div>
          </div>
          
          <!--======= BANNER BACKGROUND IMAGE =========-->
          <div class="col-md-6 no-padding main-bnr-bg" data-stellar-background-ratio="0.5"> </div>
        </div>
      </div>
      <div class="go-down scroll"> <a href="#why-choose"><i class="ion-ios-arrow-down"></i></a> </div>
    </div>
  </div>
  
  <!--======= CONTENT =========-->
  <div class="content"> 

  

  <div id="clinica-completa">
    <div class="container">
        <div class="row">
          <!--Tittle-->
          <div class="col-lg-3">
            <div class="tittle">
              <h3>Uma clínica
              completa,
              pronta para 
              atender você
              e sua família!
              </h3>
            </div>
          </div>
          
          <!-- Services Row -->
          <div class="col-lg-9">
            <ul class="row">
              
              <!-- Section -->
              <li class="col-sm-6 icons-clinica">
              <img src="./images/icons/acessivel.png" alt="">
                <div class="icons-conteudo">
                  <h6>Acessível</h6>
                  <p>Desejamos facilitar a vida dos pacientes. Por isso, oferecemos consultas de alto padrão de qualidade.</p>
                </div>
              </li>
              <!-- Section -->
              <li class="col-sm-6 icons-clinica">
                <img src="./images/icons/profissionais.png" alt="">
                <div class="icons-conteudo">
                  <h6>Profissionais</h6>
                  <p>Médicos altamente capacitados, com horários flexíveis e atendimento humanizado. </p>
                </div>
              </li>
              <!-- Section -->
              <li class="col-sm-6 icons-clinica">
                <img src="./images/icons/praticidade.png" alt="">
                <div class="icons-conteudo">
                  <h6>Práticidade</h6>
                  <p>São mais de 20 médicos prontos para te atender e mais de 2.000 pacientes atendidos mensalmente.</p>
                </div>
              </li>
              <li class="col-sm-6 icons-clinica">
                <img src="./images/icons/completa.png" alt="">
                <div class="icons-conteudo">
                  <h6>Disponibilidade</h6>
                  <p>Mais de 10 especialidades e 20 profissionais disponíveis para melhor atendê-lo.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

        </div>
    </div>
</div>
    
    <!--======= WHY CHOOSE US =========-->
    <div id="why-choose">



    <!--======= MAKE AN APPOINTMENT =========-->
    <section class="make-oppient">
      <div class="appointment">
        <div class="container">
          <div class="row">
          <!--======= Image =========-->
            <div class="col-sm-5"> 
              <h2>Diversas especialidades para cuidar da sua saúde!</h2>
              <img class="img-responsive" src="images/section-contato/doutor.png" alt="" > </div>
            <div class="col-sm-7"> 
            
              <!--======= FORM =========-->
              <form role="form" id="appointment" method="post">
                <ul class="row">
                  <li class="col-sm-6">
                    <input type="text" class="form-control" id="name" name="nome" placeholder="Nome * ">
                  </li>
                  <li class="col-sm-6">
                    <input type="email" class="form-control" id="email" name="email" placeholder="E-mail * ">
                  </li>
                  <li class="col-sm-6">
                    <input type="text" class="form-control"  name="phone" id="phone" placeholder="Telefone" >
                  </li>
                  <li class="col-sm-6">
                    <select class="form-control selectpicker" name="select1" id="select1">
                      <option selected>Especialidade</option>
                      <option>Dental</option>
                      <option>Cardiology</option>
                      <option>For disabled</option>
                      <option>Ophthalmology</option>
                      <option>Emergency</option>
                      <option>X-ray</option>
                    </select>
                  </li>
                  <li class="col-sm-6">
                    <select class="form-control selectpicker" name="select1" id="select1">
                      <option selected>Médico</option>
                      <option>Dental</option>
                      <option>Cardiology</option>
                      <option>For disabled</option>
                      <option>Ophthalmology</option>
                      <option>Emergency</option>
                      <option>X-ray</option>
                    </select>
                  </li>
                  <li class="col-sm-6">
                    <input type="text" name="datepicker" class="form-control" id="datepicker" placeholder="DD/MM/YY">
                    <i class="fa fa-calendar"></i> </li>
                  <li class="col-sm-12">
                    <button type="submit" value="submit" class="btn" id="btn_submit">Agendar</button>
                  </li>
                </ul>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!--======= Icons Alphamed =========-->
    <section class="icons-alphamed">
      <div class="container"> 
        
        <!--Address-->
        <ul class="row">
          <li class="col-md-3"> 
            <img src="./images/icons/tradicao/doctor.png" alt="">
            <h5>Tradição</h5>
            <p>+ de 70 mil clientes confiam na gente, Tradição em medicina desde 1986.</p>
          </li>
          
          <!--Hot line-->
          <li class="col-md-3"> 
            <img src="./images/icons/tradicao/money.png" alt="">
            <h5>AlphaMed</h5>
            <p>Médicos em todas as especialidades ao seu alcance. Preços acessíveis em sua consulta particular. </p>
          </li>
          
          <!--Email Contact-->
          <li class="col-md-3"> 
            <img src="./images/icons/tradicao/sprint.png" alt="">
            <h5>Agilidade</h5>
            <p>Fácil e rápido agendamento de consulta. Agende ainda para essa semana. </p>
          </li>
          
          <!--Website-->
          <li class="col-md-3"> 
            <img src="./images/icons/tradicao/calendar.png" alt="">
            <h5>Disponibilidade</h5>
            <p>Mais de 10 especialidades e 20 profissionais disponíveis para melhor atende-lo </p>
          </li>
        </ul>
      </div>
    </section>


    <section class="video-consulta">
      <div class="container">
        <div class="video-consulta-display">
          <div class="conteudo">
            <h2>Agilidade e rapidez, agende agora mesmo sua teleconsulta!</h2>
            <button class="btn" >Agendar</button>
          </div>
          <div class="imagem-celular">
            <img src="./images/mao-celular.png" alt="" >
          </div>
        </div>
      </div>
    </section>

     <!--======= LOCAL =========-->

     <section class="local">
       <div class="container">
         <div class="container-local">
           <div class="mapa">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.1823747429203!2d-46.71064788459676!3d-23.525942084700574!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef888053bacdb%3A0x625eaa4e8b048d77!2sR.%20Thom%C3%A9%20de%20Souza%2C%20207%20-%20Lapa%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005079-000!5e0!3m2!1spt-BR!2sbr!4v1594046112033!5m2!1spt-BR!2sbr" width="650" height="400" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>
           </div>
           <div class="endereco">
             <h2> <i class="fa fa-map-marker" aria-hidden="true"></i> Local</h2>
             <ul>
              <li><i class="fa fa-map-marker"></i>Rua Tomé de Souza, 207 - Alto da Lapa <br> São Paulo / SP - CEP: 05079-000</li>
              <li><i class="fa fa-envelope"></i>contato@clinicaalphamed.com.br</li>
              <li><i class="fa fa-phone"></i>11 3831.0713 / 11 3641.2323</li>
             </ul>
           </div>
         </div>
       </div>
     </section>
    
    <!--======= FOUNDER =========-->
    
    
    <!--======= TESTIMONIALS =========-->
    
  </div>
  
  <!--======= FOOTER =========-->
  <?php require_once('./include/footer.php') ?>