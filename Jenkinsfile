pipeline {
  agent any
  stages {
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        sh 'docker login -u "admin" -p "26bac9a06d51fab3a396f9afe2b22678" amrita-elective.tk:5000'
        sh 'docker build -t amrita-elective.tk:5000/api .'
        sh 'docker push amrita-elective.tk:5000/api'
        sh 'sonar-scanner -Dsonar.login="6ffd0b5dfbc1cfaf150add2d6f65f22e450200ce"'
      }
    }
    stage('Integrate') {
      when {
        not {
          branch 'master'
        }
      }
      steps {
      }
    }

  }
}