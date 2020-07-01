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
    
    <!--======= WHY CHOOSE US =========-->
    <div id="why-choose">
      <div class="container">
        <div class="row"> 
          
          <!--Tittle-->
          <div class="col-lg-3">
            <div class="tittle">
              <p>Uma clínica
              completa,
              pronta para 
              atender você
              e sua família!
              </p>
            </div>
          </div>
          
          <!-- Services Row -->
          <div class="col-lg-9">
            <ul class="row">
              
              <!-- Section -->
              <li class="col-sm-6">
                <h6>Acessível</h6>
                <p>Desejamos facilitar a vida dos pacientes. Por isso, oferecemos consultas de alto padrão de qualidade.</p>
              </li>
              <!-- Section -->
              <li class="col-sm-6">
                <h6>Profissionais</h6>
                <p>Médicos altamentes capacitados, com horários flexíveis,  com atendimento humanizado. </p>
              </li>
              <!-- Section -->
              <li class="col-sm-6">
                <h6>Práticidade</h6>
                <p>São mais de 20 médicos prontos para te atender. + de 2.000 pacientes atendidos mensalmente.</p>
              </li>
              <li class="col-sm-6">
                <h6>Completa</h6>
                <p>São mais de 10 especialidades unidas em um único local, oferecendo tratamento completo, comodidade e economia de tempo.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>


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

    <!--======= Contact Info =========-->
    <section class="icons-alphamed">
      <div class="container"> 
        
        <!--Address-->
        <ul class="row">
          <li class="col-md-3"> <i class="ion-ios-location-outline"></i>
            <h5>Tradição</h5>
            <p>+ de 70 mil clientes confiam na gente, Tradição em medicina desde 1986.</p>
          </li>
          
          <!--Hot line-->
          <li class="col-md-3"> <i class="ion-iphone"></i>
            <h5>AlphaMed</h5>
            <p>Médicos em todas as especialidades ao seu alcance. Preços acessíveis em sua consulta particular. </p>
          </li>
          
          <!--Email Contact-->
          <li class="col-md-3"> <i class="ion-ios-email-outline"></i>
            <h5>Agilidade</h5>
            <p>Fácil e rápido agendamento de consulta. Agende ainda para essa semana. </p>
          </li>
          
          <!--Website-->
          <li class="col-md-3"> <i class="ion-earth"></i>
            <h5>Disponibilidade</h5>
            <p>Mais de 10 especialidades e 20 profissionais disponíveis para melhor atende-lo </p>
          </li>
        </ul>
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
    
    <!--======= Department =========-->
    <section class="department"> 
      
      <!-- Tab Panel -->
      <div role="tabpanel">
        <div class="dep-sec-nav ab-cnter"> 
          <!-- Nav tabs -->
          <ul class="nav nav-tabs" role="tablist">
            <li role="presentation" class="active"><a href="#depart" aria-controls="home" role="tab" data-toggle="tab">OverView</a></li>
            <li role="presentation"><a href="#dental" aria-controls="home" role="tab" data-toggle="tab">Dental</a></li>
            <li role="presentation"><a href="#cardiology" aria-controls="profile" role="tab" data-toggle="tab">Cardiology </a></li>
            <li role="presentation"><a href="#for-disabled" aria-controls="messages" role="tab" data-toggle="tab">For disabled </a></li>
            <li role="presentation"><a href="#ophthalmology" aria-controls="settings" role="tab" data-toggle="tab">Ophthalmology </a></li>
            <li role="presentation"><a href="#emergency" aria-controls="settings" role="tab" data-toggle="tab"> Emergency </a></li>
            <li role="presentation"><a href="#x-ray" aria-controls="settings" role="tab" data-toggle="tab"> X-ray</a></li>
          </ul>
        </div>
        
        <!-- Tab Content -->
        <div class="tab-content">
          <div role="tabpanel" class="tab-pane fade in active" id="depart"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="depart-bg-over"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt text-left">
              <div class="tittle">
                <h2>Our Departments</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise to make a diagnosis and implement cutting-edge therapies.</p>
              <br>
              <p>Claritas est etiam processus dynamicus, qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- Dental Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="dental"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="dentel-bg"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>Dental</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise to make a diagnosis and implement cutting-edge therapies.</p>
              <p> We work in a friendly and efficient using the latest technologies and sharing our expertise to make a diagnosis.</p>
              <br>
              <p>Claritas est etiam processus dynamicus, qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- Cardiology Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="cardiology"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="cardio-bg"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>Cardiology</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise</p>
              <br>
              <p>Claritas est etiam processus dynamicus,to make a diagnosis and implement cutting-edge therapies. qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- For-Disabled Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="for-disabled"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="for-dis-bg"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>For Disabled</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise to make a diagnosis and implement cutting-edge therapies.</p>
              <br>
              <p>Claritas est etiam processus dynamicus, qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- Ophthalmology Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="ophthalmology"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="opth-bg"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>Ophthalmology</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise to make a diagnosis and implement cutting-edge therapies.</p>
              <br>
              <p>Claritas est etiam processus dynamicus, qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- Emergency Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="emergency"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- Depatment Dental Image -->
              <div class="emer-bg"></div>
            </div>
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>Emergency</h2>
              </div>
              p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise
              </p>
              <br>
              <p>Claritas est etiam processus dynamicus,to make a diagnosis and implement cutting-edge therapies. qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
          
          <!-- X Ray Depatment -->
          <div role="tabpanel" class="tab-pane fade" id="x-ray"> 
            <!-- Depatment Dental Background -->
            <div class="dep-sec-img img-bg-dep"> 
              <!-- X RAY BACKGROUND IMAGE -->
              <div class="x-ray-bg"></div>
            </div>
            
            <!-- Depatment Text Section -->
            <div class="dep-sec-txt">
              <div class="tittle">
                <h2>X Ray</h2>
              </div>
              <p>We are a team of young professionals passionate in our work. We work in a friendly and efficient using the latest technologies and sharing our expertise</p>
              <br>
              <p>Claritas est etiam processus dynamicus,to make a diagnosis and implement cutting-edge therapies. qui sequitur mut ationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, antep osuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. </p>
              <!-- Small Facts -->
              <ul class="fact row">
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Qualified Staff of Doctors</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Feel like you are at Home Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>24x7 Emergency Services</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Save your Money and Time with us</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medicine Research</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Dental Care</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Medical Consulting</p>
                </li>
                <li class="col-sm-6">
                  <p><i class="ion-erlenmeyer-flask"></i>Blood Bank</p>
                </li>
              </ul>
              <!-- BTN --> 
              <a href="#." class="btn"> View Our Services</a> 
              <!-- BTN 1 --> 
              <a href="#." class="btn btn-1 margin-l-20"> CONTACT US</a> </div>
          </div>
        </div>
      </div>
    </section>
    
    <!--======= Blog =========-->
    <section class="blog">
      <div class="container">
        <ul class="row">
          
          <!-- Tittle -->
          <li class="col-lg-4">
            <div class="tittle">
              <h2>Blog Updates</h2>
            </div>
          </li>
          
          <!-- Blog Post 1 -->
          <li class="col-lg-8">
            <div class="row">
              <div class="col-md-6"> 
                <!-- Post Image -->
                <div class="post-img right"> <img class="img-responsive" src="images/blog-img-1.jpg" alt="" > </div>
              </div>
              <!-- Post Text Sec -->
              <div class="col-md-6 text-center">
                <div class="text-section"> <a href="#.">The Hospital-Dependent Patient</a> <span>post by <strong>John Doe</strong> on <strong>April 5th, 2015</strong></span>
                  <hr>
                  <p>Claritas est etiam processus dynamicus, qui sequ itur mutationem consuetudium lectorum. Mirum est notare quam littera.</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
        
        <!--======= Blog POST 2nd ROW =========-->
        <ul class="row">
          
          <!-- Blog Post 2 -->
          <li class="col-md-4"> 
            <!-- Post Image -->
            <div class="post-img up"> <img class="img-responsive" src="images/blog-img-2.jpg" alt="" > </div>
            <!-- Post Text Sec -->
            <div class="col-md-12 text-section text-center"> <a href="#.">A Vital Measure: Your Surgeon’s Skill</a> <span>post by <strong>John Doe</strong> on <strong>April 5th, 2015</strong></span>
              <hr>
              <p>Claritas est etiam processus dynamicus, qui sequ itur mutationem consuetudium lectorum. Mirum est notare quam littera.</p>
            </div>
          </li>
          
          <!-- Blog Post 4 -->
          <li class="col-md-4"> 
            <!-- Post Text Sec -->
            <div class="text-section text-center"> <a href="#.">Spending More and Getting Less for Health Care</a> <span>post by <strong>John Doe</strong> on <strong>April 5th, 2015</strong></span>
              <hr>
              <p>Claritas est etiam processus dynamicus, qui sequ itur mutationem consuetudium lectorum. Mirum est notare quam littera.</p>
            </div>
            <!-- Post Image -->
            <div class="post-img down"> <img class="img-responsive" src="images/blog-img-3.jpg" alt="" > </div>
          </li>
          
          <!-- Blog Post 4 -->
          <li class="col-md-4"> 
            
            <!-- Post Image -->
            <div class="post-img up"> <img class="img-responsive" src="images/blog-img-4.jpg" alt="" > </div>
            
            <!-- Post Text Sec -->
            <div class="text-section text-center"> <a href="#.">Emergency Rooms Are No Place for the Elderly</a> <span>post by <strong>John Doe</strong> on <strong>April 5th, 2015</strong></span>
              <hr>
              <p>Claritas est etiam processus dynamicus, qui sequ itur mutationem consuetudium lectorum. Mirum est notare quam littera.</p>
            </div>
          </li>
        </ul>
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
    
    <!--======= INTRO =========-->
    <section class="intro">
      <div class="container">
        <div class="intro-in"> 
          <!--Tittle-->
          <div class="tittle">
            <h3>We are a team of young 
              professionals passionate in our work.</h3>
          </div>
          
          <!--Text Section-->
          <ul class="row">
            <li class="col-md-6">
              <p>Duis autem vel eum iriure dolor in hendrerit n vuew lputate velit esse molestie consequat, vel illum dolore eufe ugiat nulla facilisis at vero.</p>
            </li>
            <li class="col-md-6">
              <p>Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum seacula quarta decima quinta decima. </p>
            </li>
          </ul>
          <a href="#." class="btn">Make an appoitment</a> <a href="#." class="btn btn-1">View timetable</a> </div>
      </div>
    </section>
    
    <!--======= Contact Info =========-->
    <section class="contact-info">
      <div class="container"> 
        
        <!--Address-->
        <ul class="row">
          <li class="col-md-3"> <i class="ion-ios-location-outline"></i>
            <h5>Address</h5>
            <p>1800 Abbot Kinney Blvd. Unit D & E
              Venice, CA 90291</p>
          </li>
          
          <!--Hot line-->
          <li class="col-md-3"> <i class="ion-iphone"></i>
            <h5>Hotline</h5>
            <p>+00-0122-123-0089</p>
          </li>
          
          <!--Email Contact-->
          <li class="col-md-3"> <i class="ion-ios-email-outline"></i>
            <h5>Email contact</h5>
            <p>medikal@gmail.com</p>
            <p> contact@medikalclinic.com</p>
          </li>
          
          <!--Website-->
          <li class="col-md-3"> <i class="ion-earth"></i>
            <h5>Website</h5>
            <p>www.medikalclinic.com </p>
          </li>
        </ul>
      </div>
    </section>
  </div>
  
  <!--======= FOOTER =========-->
  <?php require_once('./include/footer.php') ?>