<?php require_once('./include/header.php') ?>
  
  <!--======= BANNER =========-->
  <div id="banner" class="full-screen">
    <div class="main-bnr">
      <div class="container-fluid">
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
                  <p>Médicos altamentes capacitados, com horários flexíveis,  com atendimento humanizado. </p>
                </div>
              </li>
              <!-- Section -->
              <li class="col-sm-6 icons-clinica">
                <img src="./images/icons/praticidade.png" alt="">
                <div class="icons-conteudo">
                  <h6>Práticidade</h6>
                  <p>São mais de 20 médicos prontos para te atender. + de 2.000 pacientes atendidos mensalmente.</p>
                </div>
              </li>
              <li class="col-sm-6 icons-clinica">
                <img src="./images/icons/completa.png" alt="">
                <div class="icons-conteudo">
                  <h6>Completa</h6>
                  <p>São mais de 10 especialidades unidas em um único local, oferecendo tratamento completo, comodidade e economia de tempo.</p>
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
    
    <!--======= FOUNDER =========-->
    <section id="founder">
      <div class="container">
        <div class="row"> 
          
          <!--Tittle-->
          <div class="col-lg-4 padding-r-80">
            <div class="tittle">
              <h2>Our Founders</h2>
            </div>
            <p>Claritas est etiam processus dynamicus,  lectorum. Mirum est notare quam est notare quam littera. Eodem modo typi, qui nunc nobis clari.</p>
            <br>
            <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam ut laoreet.</p>
          </div>
          
          <!--======= founder sliders =========-->
          <div class="col-lg-8">
            <div class="founder-slide"> 
              
              <!-- Slider 1 -->
              <div class="slide"> <img class="img-responsive" src="images/founder-1.jpg" alt="">
                <h4>Dr. Forest Aalderink</h4>
                <p>Clinic president</p>
              </div>
              
              <!-- Slider 2 -->
              <div class="slide"> <img class="img-responsive" src="images/founder-2.jpg" alt="">
                <h4>Dr. Bryce Butler</h4>
                <p>Clinic president</p>
              </div>
              
              <!-- Slider 3 -->
              <div class="slide"> <img class="img-responsive" src="images/founder-1.jpg" alt="">
                <h4>Dr. Bryce Butler</h4>
                <p>Clinic president</p>
              </div>
              
              <!-- Slider 4 -->
              <div class="slide"> <img class="img-responsive" src="images/founder-2.jpg" alt="">
                <h4>Dr. Bryce Butler</h4>
                <p>Clinic president</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    
    <!--======= TESTIMONIALS =========-->
    <section class="testimonials">
      <div class="container">
        <div class="row"> 
          
          <!-- Video Section -->
          <div class="col-md-8">
            <div class="video">
              <iframe src="https://player.vimeo.com/video/7449107"></iframe>
            </div>
          </div>
          
          <!-- Feedback Section -->
          <div class="col-md-4 padding-l-60">
            <div class="texti-slide"> 
              
              <!-- Slider 1 -->
              <div class="slide"> 
                
                <!-- Media Avatar -->
                <div class="media-left media-middle"> <img class="media-object" src="images/avatar.jpg" alt=""> </div>
                <div class="media-body">
                  <h6>Clare Mitchell</h6>
                  <span>Web Designer</span> </div>
                
                <!-- Text Section -->
                <div class="text">
                  <p>Lorem ipsum doltor sit amet, soluta nobiscon sectetuer adipiscing elit, sed diam ut soluta soluta nobiscon sectetuer adipiscing laoreet.</p>
                </div>
              </div>
              
              <!-- Slider 2 -->
              <div class="slide"> 
                
                <!-- Media Avatar -->
                <div class="media-left media-middle"> <img class="media-object" src="images/avatar-1.jpg" alt=""> </div>
                <div class="media-body">
                  <h6>Clare Mitchell</h6>
                  <span>CEO Doctor</span> </div>
                
                <!-- Text Section -->
                <div class="text">
                  <p>Lorem ipsum doltor sit amet,soluta nobiscon sectetuer adipiscing  soluta nobiscon sectetuer adipiscing elit, sed diam ut soluta laoreet.</p>
                </div>
              </div>
              
              <!-- Slider 3 -->
              <div class="slide"> 
                
                <!-- Media Avatar -->
                <div class="media-left media-middle"> <img class="media-object" src="images/avatar-2.jpg" alt=""> </div>
                <div class="media-body">
                  <h6>M_Adnan A </h6>
                  <span>Web Designer</span> </div>
                
                <!-- Text Section -->
                <div class="text">
                  <p> Lorem ipsum doltor sit amet, soluta nobiscon sectetuer adipiscing elit, sed diam ut soluta laoreet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
  </div>
  
  <!--======= FOOTER =========-->
  <?php require_once('./include/footer.php') ?>